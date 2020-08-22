const glob = require('glob');
// const { rq } = require('request-promise-native');
const promisify = require('util').promisify;
const pGlob = promisify(glob);
// const gfsPath = 'H:/data/cyclone/json_format/ncep/GFS/';
// const gefsPath = 'H:/data/cyclone/json_format/ncep/GEFS/';
// const necpPath = 'H:/data/cyclone/json_format/ncep/';
let config = {
  'necp':{
    detPath: 'H:/data/cyclone/json_format/ncep/GFS/',
    ensPath: 'H:/data/cyclone/json_format/ncep/GEFS/',
    combinePath: 'H:/data/cyclone/json_format/ncep/',
    detGlobExp: '*_GFS.json',
    ensGlobExp: '*_GEFS.json',
    detMatchExp: /(\d+.*?)_GFS\.json/,
    ensMatchExp: /(\d+.*?)_GEFS\.json/,
    fileSuffix: '_NCEP',
  },
  'msc':{
    detPath: 'H:/data/cyclone/json_format/msc/CMC/',
    ensPath: 'H:/data/cyclone/json_format/msc/CENS/',
    combinePath: 'H:/data/cyclone/json_format/msc/MSC_combine/',
    detGlobExp: '*_CMC.json',
    ensGlobExp: '*_CENS.json',
    detMatchExp: /(\d+.*?)_CMC\.json/,
    ensMatchExp: /(\d+.*?)_CENS\.json/,
    fileSuffix: '_MSC',
  },
}

let iConfig = config.msc;

const fs = require('fs').promises;
async function main(){
  const detOpt = {
    cwd: iConfig.detPath,
  };
  let detFileList = await pGlob(iConfig.detGlobExp, detOpt);

  const ensOpt = {
    cwd: iConfig.ensPath,
  }
  let ensFileList = await pGlob(iConfig.ensGlobExp, ensOpt);
  
  // console.log(detFileList);
  let detMetaArr = detFileList.map(filePath=>{
    let mathStr = filePath.match(iConfig.detMatchExp);
    // console.log(mathStr);
    return [mathStr[1],{common: mathStr[1], detFile:filePath}];
  });
  let ensMetaArr = ensFileList.map(filePath=>{
    let mathStr = filePath.match(iConfig.ensMatchExp);
    // console.log(mathStr);
    return [mathStr[1],{common: mathStr[1], ensFile:filePath}];
  });

  let fileMap = new Map(detMetaArr);
  for(let info of ensMetaArr){
    // console.log(fileMap.has(info[0]));
    if(fileMap.has(info[0])){ // 在集合预报中有对应键
      let newInfo = fileMap.get(info[0]);
      newInfo.ensFile = info[1].ensFile;
      fileMap.set(info[0], newInfo);
    }else{ // 没有则直接新建键值
      fileMap.set(info[0], info[1]);
    }
  }

  for (let info of fileMap.values()) {
    if(info.hasOwnProperty('ensFile')){
      let ensFile = await fs.readFile(iConfig.ensPath+info.ensFile);
      let tc = JSON.parse(ensFile);
      tc.tcID = info.common + iConfig.fileSuffix;
      if(info.hasOwnProperty('detFile')){// 同时有GFS和GEFS
        let detFile = await fs.readFile(iConfig.detPath+info.detFile);
        let detTC = JSON.parse(detFile);
        tc.detTrack = detTC.tracks[0];
        // console.log(info.common);
      }else{// 只有集合预报
        console.log(info.common+'只有集合预报');
      }
      fs.writeFile(iConfig.combinePath+tc.tcID+'.json', JSON.stringify(tc,null,2));
    }else{// 只有确定性预报
      let detFile = await fs.readFile(iConfig.detPath+info.detFile);
      let tc = JSON.parse(detFile);
      tc.detTrack = tc.tracks[0];
      delete tc.tracks;
      tc.tcID = info.common + iConfig.fileSuffix;
      console.log(info.common+'只有确定性预报');
      fs.writeFile(iConfig.combinePath+tc.tcID+'.json', JSON.stringify(tc,null,2));
    }
  }
}

main().catch(err=>{
  throw err;
})