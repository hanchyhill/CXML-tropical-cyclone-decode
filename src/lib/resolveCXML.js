const {promisify} = require('util');
const parseString = promisify(require('xml2js').parseString);
const moment = require('moment');
const path = require('path');

/**
 * main 转换XML到JSON主程序
 * @param {String} CXML XML文件数据
 */
const main = async function(CXML=''){
  let result = await parseString(CXML);

  const model = result.cxml.header[0].generatingApplication[0].model[0].name[0];
  const baseTime = result.cxml.header[0].baseTime[0];
  const initTime = moment(baseTime,'YYYY-MM-DDTHH:mm:ssZ').toDate();
  console.log(initTime);
  const allMember = result.cxml.data; //Array
  let filterMenber = allMember.filter(member=>!!member.disturbance);
  const memberList = filterMenber.map(resolveMember);// 过滤空数据
  let data = {
    model,
    ins:'NCEP',
    initTime,
    memberList,
  }
  let transferData = combineTC(data);
  return transferData;
}

/**
 * 解析单个成员
 * @param {Object} member 第几个预报成员
 */
function resolveMember(member={$:{type:'',member:''}}){
  const fcType = member.$.type//预报类型
  const ensembleNumber = parseInt(member.$.member);
  // console.log(member);
  if(!member.disturbance){
    return null;
  }
  try{
    const TClist = member.disturbance.map(resolveTC);
    const singleMember = {
      fcType,
      ensembleNumber,
      TClist,
    }
    return singleMember;
  }catch(err){
    console.log(err);
  }
  
}

/**
 * 解析TC元数据
 * @param {Object} tc 第几个扰动
 */
function resolveTC(tc = {}){
  const cycloneNumber = tc.cycloneNumber? tc.cycloneNumber[0] : null;
  const cycloneName = tc.cycloneName? tc.cycloneName[0] : null;
  const localName = tc.localName? tc.localName[0] : null;
  const basinShort2 = tc.basin[0];
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
    basinShort2,
    loc,
    track,
  }
}

/**
 * 解析单个路径
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
  return [hour,[lon,lat],pressure,wind];
  //['时效',['经度','纬度'],'气压','风速',['最大风速经度纬度','最大风速经度纬度']
}

/**
 * 转换成所需JSON格式
 * @param {Object} data 
 */
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
  for(let tc of mixData){
    tc.tcID = `${moment(tc.initTime).format('YYYYMMDDHH')}_${tc.cycloneName}_${tc.cycloneNumber}${tc.basinShort2}_${tc.model}`;
    tc.controlIndex = tc.tracks.findIndex(t=>t.ensembleNumber==0);
    tc.fillStatus = 2;
  };
  return mixData;
}

/**
 * 解析所需的最大风和位置信息
 * @param {Object} item 
 */
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

/**
 * 判断是否是同一个TC
 * @param {Object} main 
 * @param {Object} current 
 */
function compareSameTC(main,current){
  let curID = current.basinShort2 + current.cycloneNumber + current.cycloneName;
  let mainID = main.basinShort2 + main.cycloneNumber + main.cycloneName;
  if(curID == mainID){
    return true;
  }else{
    return false;
  }
}

module.exports = {
  resolveCXML:main,
};