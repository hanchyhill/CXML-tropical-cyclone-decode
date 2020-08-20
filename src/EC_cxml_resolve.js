//const parseString = require('xml2js').parseString;
// TODO  确定性预报抽取出来
// 分析报数据填入meta信息当中
const fs = require('fs').promises;
const {promisify} = require('util');
const parseString = promisify(require('xml2js').parseString);
const moment = require('moment');
const path = require('path');
//var xml = '<cxml units="deg"><fix number="0">Hello</fix>test<fix number="1">xml2js!</fix></cxml>';


const config = {
  targetPath: 'H:/data/cyclone/json_format/ecmwf/',//__dirname + '/ecJSON/',
}
/**
 * 解析EC CXML数据
 * @param {String} fileURI 文件路径
 */
const main = async function(fileURI=path.resolve(__dirname,'./xml/z_tigge_c_ecmf_20190317120000_ifs_glob_prod_all_glo.xml')){
  // let fileURI = path.resolve(__dirname,'./xml/z_tigge_c_ecmf_20190317120000_ifs_glob_prod_all_glo.xml');
  // console.log(fileURI);
  const xmlFile = await fs.readFile(fileURI).catch(err=>{
    console.error('无法打开文件: '+fileURI);
    fs.appendFile('./ec_resolve_log.txt', '无法打开文件: '+fileURI+'\n');
    throw err;
  });
  let result = await parseString(xmlFile).catch(err=>{
    console.error('异常XML: '+fileURI);
    fs.appendFile('./ec_resolve_log.txt', '异常XML: '+fileURI+'\n');
    throw err;
  });

  // await fs.writeFile(path.resolve(__dirname,'./xml/20190317120000_ecmwf.json'),JSON.stringify(result,null,2));

  const model = result.cxml.header[0].productionCenter[0];
  const baseTime = result.cxml.header[0].baseTime[0];
  const initTime = moment(baseTime,'YYYY-MM-DDTHH:mm:ssZ').toDate();
  // console.log(initTime);
  const allMember = result.cxml.data; //Array
  let analysisList = allMember.filter(member=>member.$.type == 'analysis');
  let filterMenber = allMember.filter(member=>!!member.disturbance&&member.$.type != 'analysis');
  // resolveMember(filterMenber[1]);
  const analysisData = resolveAnalysis(analysisList[0]);
  const memberList = filterMenber.map(resolveMember);
  try{
    analysisList = analysisList[0].disturbance.map(member=>{
      let lat,lon;
      let track = member.fix[0];
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
      return {
        ID: member.$.ID,
        basin: member.basin[0],
        cycloneNumber: member.cycloneNumber?member.cycloneNumber[0]:'0',
        loc: [lon,lat],
      }
    });
  }catch (e){
    console.log('数据异常:' + fileURI);
    fs.appendFile('./ec_resolve_log.txt', '数据异常:' + fileURI +'\n');
    throw e;
  }
  let data = {
    model,
    ins:'ecmwf',
    initTime,
    memberList,
  }
  //await fs.writeFile(__dirname+'/xml/20190212000000_GEFS_TCJSON.json', JSON.stringify(data,null,2));
  //console.log(JSON.stringify(data,null,2));
  
  let transferData = combineTC(data);
  transferData = transferData.filter(tc=>Number.parseInt(tc.cycloneNumber)<70);
  transferData.forEach(tc=>{
    let basin = tc.basin;
    let cycloneNumber = tc.cycloneNumber;
    let innerID = tc.innerID;
    let theSameTC = analysisList.find(member=>{
      return basin==member.basin && cycloneNumber == member.cycloneNumber && innerID == member.ID;
    });
    if(theSameTC){
      tc.loc = theSameTC.loc;
    }
  });
  // await fs.writeFile(__dirname+'/xml/20190317120000_ecmwf_final.json', JSON.stringify(transferData,null,2));
  for(let tc of transferData){
    fs.writeFile(config.targetPath + tc.tcID + '.json', JSON.stringify(transferData,null,2));
  }
  return transferData;
  //
}

/**
 * 
 * @param {Object} member 第几个预报成员
 */
function resolveMember(member={$:{type:'',member:''}}){
  const fcType = member.$.type//预报类型
  // type -> enum['forecast','ensembleForecast']
  const ensembleNumber = parseInt(member.$.member);
  let disturbance = member.disturbance.filter(tc=>!!tc.cycloneNumber&&(!!tc.fix));// 过滤
  const TClist = disturbance.map(resolveTC);
  const singleMember = {
    fcType,
    ensembleNumber:isNaN(ensembleNumber)?null:ensembleNumber,
    TClist,
  }
  return singleMember;
}

function resolveAnalysis(analysis={$:{type:'analysis'}, disturbance:[]}){
  let disturbance = analysis.disturbance.filter(tc=>!!tc.cycloneNumber&&(!!tc.fix));// 过滤
  const TClist = disturbance.map(tc=>{
    const cycloneNumber = tc.cycloneNumber? tc.cycloneNumber[0] : null;
    const cycloneName = tc.cycloneName? tc.cycloneName[0] : null;
    const localName = tc.localName? tc.localName[0] : null;
    const basin = tc.basin[0];
    const fix = tc.fix[0];
    let lat,lon;
    if(fix.latitude[0].$.units.toUpperCase().includes('DEG N')){//是否是北纬
      lat = Number(fix.latitude[0]._);
    }else{
      lat = Number(fix.latitude[0]._ ) * -1;
    }
  
    if(fix.longitude[0].$.units.toUpperCase().includes('DEG E')){//是否是北纬
      lon = Number(fix.longitude[0]._);
    }else{
      lon = Number(fix.longitude[0]._ ) * -1;
    }
    return {
      cycloneNumber,
      cycloneName,
      localName,
      // basinShort3: basin.split(' ').map(str=>str[0]).join(''),
      basin,
      loc:[lon, lat],
      innerID: tc.$.ID,
    }
  });
  return TClist;
}

/**
 * 
 * @param {Object} tc 第几个扰动
 */
function resolveTC(tc = {}){
  const cycloneNumber = tc.cycloneNumber? tc.cycloneNumber[0] : null;
  const cycloneName = tc.cycloneName? tc.cycloneName[0] : null;
  const localName = tc.localName? tc.localName[0] : null;
  const basin = tc.basin[0];
  const track = tc.fix.map(resolveTrack);
  let tcID = tc.$.ID;
  let latList = tcID.match(/_(\d+)([S|N])_/); // [ "_254N_", "254N", "N" ]
  let lonList = tcID.match(/_(\d+)([E|W])$/);
  let loc = [null,null];

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
  return {
    cycloneNumber,
    cycloneName,
    localName,
    // basinShort3: basin.split(' ').map(str=>str[0]).join(''),
    basin,
    loc,
    track,
    innerID:tc.$.ID,
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
  const pressure = Number(cycloneData.minimumPressure[0].pressure[0]._);
  let wind;
  if(cycloneData.maximumWind[0].speed[0].$.units.toUpperCase().includes('KT')){
    wind = Number(cycloneData.maximumWind[0].speed[0]._) * 0.51444; // 节
  }else{
    wind = Number(cycloneData.maximumWind[0].speed[0]._); // 默认米每秒
  }
  let winLon, winLat;

  if(cycloneData.maximumWind[0].latitude[0].$.units.toUpperCase().includes('DEG N')){//是否是北纬
    winLat = Number(cycloneData.maximumWind[0].latitude[0]._);
  }else{
    winLat = Number(cycloneData.maximumWind[0].latitude[0]._ ) * -1;
  }

  if(cycloneData.maximumWind[0].longitude[0].$.units.toUpperCase().includes('DEG E')){//是否是北纬
    winLon = Number(cycloneData.maximumWind[0].longitude[0]._);
  }else{
    winLon = Number(cycloneData.maximumWind[0].longitude[0]._ ) * -1;
  }
  return [hour, [lon, lat], pressure, wind, [winLon, winLat] ];
  //['时效',['经度','纬度'],'气压','风速',['最大风速经度纬度','最大风速经度纬度']
}

function combineTC(data){
  let mixData = data.memberList.reduce((final,member)=>{
    memberNumber = member.ensembleNumber;
    for(let tc of member.TClist){
      const found = final.find((ele)=>compareSameTC(ele,tc));
      let newTC;
      if(found){//找到则把路径插入到相同TC中
        // console.log(found);
        // console.log(tc);
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
        // if(tc.basinShort3) newTC.basinShort3 = tc.basinShort3;
        if(tc.basin) newTC.basin = tc.basin;
        if(tc.cycloneNumber) newTC.cycloneNumber = tc.cycloneNumber;
        if(tc.cycloneName) newTC.cycloneName = tc.cycloneName;
        if(tc.innerID) newTC.innerID = tc.innerID;
        final.push(newTC);
      }
    }
    return final;
  },[]);
  // TODO 加入机构数据
  mixData = mixData.map(item=>{
    // 经纬度靠ID读取
    item.ins = data.ins;
    item.model = data.model;
    item.initTime = data.initTime;
    let newProps = calTCprops(item);
    Object.assign(item,newProps);
    return item;
  });
  // find detTrack
  for(let tc of mixData){
    tc.tcID = `${moment(tc.initTime).format('YYYYMMDDHH')}_${tc.cycloneName?tc.cycloneName:tc.cycloneNumber}_${tc.cycloneNumber}${tc.basin.replace(' ','')}_${tc.model}`;
    let detIndex = tc.tracks.findIndex(t=>t.fcType=='forecast'||t.fcType==0);
    if(detIndex>-1){
      tc.detTrack = tc.tracks[detIndex];
      tc.tracks.splice(detIndex, 1);
    }
    
  };
  // find controlIndex
  for(let tc of mixData){
    let detTrackIndex = tc.tracks.findIndex(t=>t.fcType=='forecast');
    if(detTrackIndex>-1){
      tc.detTrack = tc.tracks[detTrackIndex];
      tc.tracks.splice(detTrackIndex,1);
    }
  };
  for(let tc of mixData){
    tc.tcID = `${moment(tc.initTime).format('YYYYMMDDHH')}_${tc.cycloneName?tc.cycloneName:tc.cycloneNumber}_${tc.cycloneNumber}${tc.basin.replace(' ','-')}_${tc.model}`;
    tc.controlIndex = tc.tracks.findIndex(t=>t.ensembleNumber==0);
    tc.fillStatus = 2;
  };
  return mixData;
}

function fitECanalysis(tcList, analysis){
  return tcList;
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
  let curID = current.cycloneNumber + current.basin;
  let mainID = main.cycloneNumber + main.basin;
  // console.log(curID, mainID);
  if(curID == mainID){
    return true;
  }else{
    return false;
  }
}
if (!module.parent) {
  main('H:/data/cyclone/ecmwf/2006/20061022/z_tigge_c_ecmf_20061022000000_ifs_glob_test_all_glo.xml')
    .then(data=>{
      // fs.writeFile(path.resolve(__dirname,'./xml/20190315000000_UKMO_JSON2.json'),JSON.stringify(data,null,2));
    })
    .catch(err=>{console.trace(err);
    }
    );
}

exports.ecCxmlResolve = main;