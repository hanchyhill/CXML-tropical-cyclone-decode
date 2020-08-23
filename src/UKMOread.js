//const parseString = require('xml2js').parseString;
const fs = require('fs').promises;
const {promisify} = require('util');
const parseString = promisify(require('xml2js').parseString);
const moment = require('moment');
const path = require('path');
// const decompress = require('decompress');
// const decompressGz = require('decompress-gz');
const {ungzip} = require('node-gzip');
//var xml = '<cxml units="deg"><fix number="0">Hello</fix>test<fix number="1">xml2js!</fix></cxml>';

const config = {
  targetPath: 'H:/data/cyclone/json_format/ukmo/',//__dirname + '/ecJSON/',
  logFile: 'F:/github/CXML-tropical-cyclone-decode/src/logs/UKMO_resolve_log.txt',
  demoFile: "F:/github/CXML-tropical-cyclone-decode/src/xml/z_tigge_c_egrr_20190315000000_mogreps_glob_prod_etctr_glo.xml",
  demoFile2: "H:/data/cyclone/ukmo/2015/20151103/z_tigge_c_egrr_20151103120000_mogreps_glob_prod_etctr_glo.xml.gz",
  demoFile3: "H:/data/cyclone/ukmo/2014/20140331/fix.z_tigge_c_egrr_20140331120000_mogreps_glob_prod_etctr_glo.xml.gz",
}

let debugConfig = {

};

const main = async function(fileURI){
  debugConfig.fileURI = fileURI;
  // let dirPath = path.dirname(fileURI);
  // console.log(dirPath);
  const gzXmlFile = await fs.readFile(fileURI).catch(err=>{
    console.error('无法打开文件: '+fileURI);
    fs.appendFile(config.logFile, '无法打开文件: '+fileURI+'\n');
    throw err;
  });
  const deCompressFile = await ungzip(gzXmlFile).catch(err=>{
    console.error('无法解压: '+fileURI);
    fs.appendFile(config.logFile, '无法解压: '+fileURI+'\n');
    throw err;
  });
  let result = await parseString(deCompressFile).catch(err=>{
    console.error('异常XML: '+fileURI);
    fs.appendFile(config.logFile, '异常XML: '+fileURI+'\n');
    throw err;
  });

  // fs.writeFile(path.resolve(__dirname,'./xml/20190315000000_UKMO.json'),JSON.stringify(result,null,2));

  const model = result.cxml.header[0].generatingApplication[0].model[0].name[0];
  const numMembers = result.cxml.header[0].generatingApplication[0].ensemble[0].numMembers[0];
  const baseTime = result.cxml.header[0].baseTime[0];
  let momentInitTime = moment(baseTime,'YYYY-MM-DDTHH:mm:ssZ');
  let initTime;
  if(!momentInitTime.isValid()){
    // 数据为空时会触发此错误
    console.error('错误的日期格式: '+fileURI);
    fs.appendFile(config.logFile, '错误的日期格式: '+fileURI+'\n');
    timeMatch = fileURI.match(/\d{10}/);
    initTime = moment(timeMatch[0]+':00:00Z','YYYYMMDDHH:mm:ssZ').toDate();
    fs.appendFile(config.logFile, '修正为: '+initTime+'\n');
  }else{
    initTime = moment(baseTime,'YYYY-MM-DDTHH:mm:ssZ').toDate();
  }
  console.log(initTime);
  const allMember = result.cxml.data; //Array
  let filterMenber = allMember.filter(member=>!!member.disturbance);
  const memberList = filterMenber.map(resolveMember);
  let data = {
    model,
    numMembers: parseInt(numMembers),
    ins:'UKMO',
    initTime,
    memberList,
  }
  //await fs.writeFile(__dirname+'/xml/20190212000000_GEFS_TCJSON.json', JSON.stringify(data,null,2));
  //console.log(JSON.stringify(data,null,2));
  
  let transferData = combineTC(data);

  for(let tc of transferData){
    if(tc.basinShort2 == 'WP') tc.basinShort = 'W';
    fs.writeFile(config.targetPath + tc.tcID + '.json', JSON.stringify(tc,null,2));
  }

  // await fs.writeFile(__dirname+'/xml/20190315000000_UKMO_final.json', JSON.stringify(transferData,null,2));
  //return transferData;
  //console.log(JSON.stringify(result,null,2));
  return transferData;
  //
}

/**
 * 
 * @param {Object} member 第几个预报成员
 */
function resolveMember(member={$:{type:'',member:''}}){
  const fcType = member.$.type//预报类型
  const ensembleNumber = parseInt(member.$.member);
  let disturbance = member.disturbance.filter(tc=>!!tc.cycloneNumber);// 过滤
  let TClist = disturbance.map(resolveTC);
  TClist = TClist.filter(tc=>tc.error!==true);
  const singleMember = {
    fcType,
    ensembleNumber,
    TClist,
  }
  return singleMember;
}

/**
 * 
 * @param {Object} tc 第几个扰动
 */
function resolveTC(tc = {}){
  const cycloneNumber = tc.cycloneNumber? tc.cycloneNumber[0] : null;
  const cycloneName = tc.cycloneName? tc.cycloneName[0] : null;
  const localName = tc.localName? tc.localName[0] : null;
  const localID = tc.localID? tc.localID[0] : null;
  const basinShort2 = tc.basin[0];
  let track;
  try{
    track = tc.fix.map(resolveTrack);
  }catch(err){
    console.error('解析trak问题: '+debugConfig.fileURI);
    fs.appendFile(config.logFile, '无法打开文件: '+debugConfig.fileURI+'\n');
    throw err;
  }
  let tcID = tc.$.ID;
  let latList = tcID.match(/_(\s?\d+)([S|N])_/); // [ "_254N_", "254N", "N" ]
  let lonList = tcID.match(/_(\s?\d+)([E|W])$/);
  let loc = [null,null];
  try{
    if(lonList[2] == 'W'){//经度
      loc[0] = parseInt(lonList[1])/10.0*-1;//西半球乘以-1
    }else{
      loc[0] = parseInt(lonList[1])/10.0;//东半球
    }
  
    if(latList[2] == 'S'){//纬度
      loc[1] = parseInt(latList[1])/10.0*-1;
    }else{
      loc[1] = parseInt(latList[1])/10.0;
    }
  }catch(err){
    console.log(`无法读取经纬度: ${debugConfig.fileURI} -> ${tcID} ${localID}`);
    fs.appendFile(config.logFile, `无法读取经纬度: ${debugConfig.fileURI} -> ${tcID} ${localID}\n`);
    return {
      error: true,
    }
  }
  return {
    cycloneNumber,
    cycloneName,
    localName,
    basinShort2,
    loc,
    localID,
    track,
  }
}

/**
 * 
 * @param {Object} track 路径解析
 */
function resolveTrack(track={}){
  const hour = parseInt(track.$.hour);
  let lat,lon;
  if(track.latitude[0].$.units.toUpperCase().includes('DEG N')){//是否是北纬
    lat = Number(track.latitude[0]._);
  }else{
    lat = Number(track.latitude[0]._ ) * -1;
  }

  if(track.longitude[0].$.units.toUpperCase().includes('DEG E')){//是否是北纬
    lon = Number(track.longitude[0]._);
  }else{
    lon = Number(track.longitude[0]._ ) * -1;
  }

  let cycloneData = track.cycloneData[0];
  // TODO 没有强度信息，值为 -9999; 
  let pressure;
  if(cycloneData.hasOwnProperty('minimumPressure')){
    pressure = Number(cycloneData.minimumPressure[0].pressure[0]._);
  }else{
    pressure = -9999.99;
  }

  let wind;
  if(cycloneData.hasOwnProperty('maximumWind')){
    if(cycloneData.maximumWind[0].speed[0].$.units.toUpperCase().includes('KT')){
      wind = Number(cycloneData.maximumWind[0].speed[0]._) * 0.51444; // 节
    }else{
      wind = Number(cycloneData.maximumWind[0].speed[0]._); // 默认米每秒
    }
  }else{
    pressure = -9999.99;
  }

  
  return [hour,[lon,lat],pressure,wind];
  //['时效',['经度','纬度'],'气压','风速',['最大风速经度纬度','最大风速经度纬度']
}

function combineTC(data){
  let mixData = data.memberList.reduce((final,member)=>{
    memberNumber = member.ensembleNumber;
    for(let tc of member.TClist){
      const found = final.find((ele)=>compareSameTC(ele,tc));
      let newTC;
      if(found){//找到则把路径插入到相同TC中
        newTC = {
          fcType: member.fcType,//预报类型
          ensembleNumber: member.ensembleNumber,//第几个集合预报
          loc:tc.loc,
          track:tc.track
        };
        found.tracks.push(newTC);
      }else{//未找到则生成新TC插入数列
        newTC = {
          tracks:[{
            fcType: member.fcType,//预报类型
            ensembleNumber: member.ensembleNumber,//第几个集合预报
            loc:tc.loc,
            track:tc.track}
          ],
        };
        if(tc.basinShort2) newTC.basinShort2 = tc.basinShort2;
        if(tc.cycloneNumber) newTC.cycloneNumber = tc.cycloneNumber;
        if(tc.cycloneName) newTC.cycloneName = tc.cycloneName;
        if(tc.localID) newTC.localID = tc.localID;
        final.push(newTC);
      }
    }
    return final;
  },[]);
  // TODO 加入机构数据
  mixData = mixData.map(item=>{
    // 经纬度靠ID读取
    item.ins = data.ins;
    item.numMembers = data.numMembers;
    item.model = data.model;
    item.initTime = data.initTime;
    let newProps = calTCprops(item);
    Object.assign(item,newProps);
    return item;
  });
  for(let tc of mixData){
    tc.tcID = `${moment(tc.initTime).format('YYYYMMDDHH')}_${tc.cycloneName}_${tc.cycloneNumber}${tc.basinShort2}_${tc.model}`;
    tc.controlIndex = tc.tracks.findIndex(t=>t.ensembleNumber==0);
    tc.fillStatus = 2;
  };
  return mixData;
}

function calTCprops(item={tracks:[{loc:[120,5],track:[[0,[120,5],998,18]]}]}){
  // item.tracks.map(v=>{v.track.map(point=>point[3])});
  item.tracks.forEach(v=>{

    v.maxWind = Math.max(...v.track.map(point=>point[3]));
  });
  let maxWind = Math.max(...item.tracks.map(v=>v.maxWind));
  let aveLoc = [null,null];

  aveLoc[0] = item.tracks.reduce((sum,cv)=>{
    sum = sum + cv.loc[0];
    return sum
  },0) / item.tracks.length;

  aveLoc[1] = item.tracks.reduce((sum,cv)=>{
    sum = sum + cv.loc[1];
    return sum
  },0) / item.tracks.length;

  return {maxWind,loc:aveLoc};
  //let maxWind =  Math.max(...item.tracks.map()track.map(ponit=>point[3]));1
}

//比较是否是相同TC/
function compareSameTC(main,current){
  let curID = current.basinShort2 + current.cycloneNumber + current.cycloneName;
  let mainID = main.basinShort2 + main.cycloneNumber + main.cycloneName;
  if(curID == mainID){
    return true;
  }else{
    return false;
  }
}

if (!module.parent) {
  main(config.demoFile3)
    .then(data=>{
      // fs.writeFile(path.resolve(__dirname,'./xml/20190315000000_UKMO_JSON2.json'),JSON.stringify(data,null,2));
    })
    .catch(err=>{console.trace(err);
    }
    );
}

module.exports = {
  resolveCXML:main,
};