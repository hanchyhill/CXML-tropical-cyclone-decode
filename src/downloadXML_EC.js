const rp = require('request-promise-native');
// const tough = require('tough-cookie');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const {pMakeDir,isExists,writeFile,myDebug} = require('./lib/util.js');
const pMap = require('p-map');
const {resolveCXML} = require('./lib/resolveCXML.js');
// const {connect,initSchemas} = require('./db/initDB.js');
const moment = require('moment');
let {cookiejar} = require('./config/private.config.js');
// Easy creation of the cookie - see tough-cookie docs for details
let save2DB;
let modelConfig = {
  'GEFS':{
    name:'GEFS',
    resolveMode:'GEFS',
    modelType:2,// 1-确定性模式，2-集合预报
    fitID(){},
  },
  'GFS':{
    name:'GEFS',
    resolveMode:'GFS',
    modelType:1,
    ins:'NCEP',
    fitID(){},
  },
  'MOGREPS-G':{
    name:'UKMO',
    resolveMode:'GFS',
    modelType:1,
    ins:'NCEP',
    fitID(){},
  },
  'ECMWF':{
    name:'ECMWF',
    resolveMode:'GFS',
    modelType:1,
    ins:'ecmwf',
    fitID(){},
  }
};

let insConfig = {
  cma: {
    base: 'https://rda.ucar.edu/data/ds330.3/index.html?g=2',
    initTime: '200807',
    flag:'_babj_',
    dir:'cma',
    finalTime: '201412',
  },
  mfi: {
    base: 'https://rda.ucar.edu/data/ds330.3/index.html?g=7',
    initTime: '201101',
    flag:'_lfpw_',
  },
  kma: {
    base: 'https://rda.ucar.edu/data/ds330.3/index.html?g=9',
    initTime: '200807',
    flag:'_rksl_',
    dir:'kma',
    finalTime: '201010',
  },
  msc: {
    base: 'https://rda.ucar.edu/data/ds330.3/index.html?g=6',
    initTime: '200807',
    flag:'00_C',
    dir:'msc',
    finalTime: '201001',
  },
  ecmwf:{
    base: 'https://rda.ucar.edu/data/ds330.3/index.html?g=4',
    initTime: '200807',
    flag:'00_C',
    dir:'ecmwf',
    finalTime: '201001',
  },
  ncep:{
    base: 'https://rda.ucar.edu/data/ds330.3/index.html?g=6',
    initTime: '200807',
    flag:'00_C',
    dir:'ncep',
    finalTime: '201001',
  },
  ukmo:{
    base: 'https://rda.ucar.edu/data/ds330.3/index.html?g=5',
    initTime: '200807',
    flag:'00_C',
    dir:'ukmo',
    finalTime: '201001',
    urlInsFlag:'egrr',
  },
  custom:{
    base: 'https://rda.ucar.edu/data/ds330.3/index.html?g=5',
    initTime: '200807',
    flag:'00_C',
    dir:'custom/ukmo',
    finalTime: '201001',
    urlInsFlag:'egrr',
  }
}
let iConfig = insConfig.custom;
let baseUrl = 'https://rda.ucar.edu';

// 代理服务器ip和端口
let proxy_ip = '127.0.0.1';
let proxy_port = 10809;
let util = require('util');
// 完整代理服务器url
let proxy = util.format('http://%s:%d', proxy_ip, proxy_port);  

/**
 * 
 * @param {String} dateUrl URL地址
 */
const rqMonthList = async function(dateUrl='https://rda.ucar.edu/data/ds330.3/index.html?g=61902') {//请求月数据数组
  const url_date = dateUrl;//NCEP 所在月份目录
  let options = {
    uri: url_date,
    jar: cookiejar, // Tells rp to include cookies in jar that match uri
    timeout: 70*1000,
    proxy: proxy,
  };
  let body;
  try {
    body = await rp(options);
  } catch (err) {
    console.error(err);
    throw err;
  }

  const $ = cheerio.load(body);
  let hrefList = $('table.filelist td a:first-child');
  //判断类型
  //判断长度
  // 空则退出
  if(!hrefList) return console.log('此页面没有数据');
  //console.log(hrefList.length);
  //console.log(hrefList instanceof Array);
  let links = [];
  hrefList.each(function(i, elem) {
    links.push($(this).attr('href'));
  });
  // console.log(links);
  fs.writeFile(path.resolve(__dirname,'test/link.json'),JSON.stringify(links,null,2),err=>err?console.error(err):'');
  // let listGEFS = links.filter(v=>v.includes('_CENS_'));
  // let listGFS = links.filter(v=>v.includes('_CMC_'));
  let listEC = links.filter(v=>v.includes(iConfig.flag));
  //在数据库查询是否存在此文件
  // 不存在则准备下载文件
  //TODO 
  try{
    // if(listGEFS){
    //   // console.log('download GEFS')
    //   await downloadFromArr(listGEFS,'GEFS');
    // }
    // if(listGFS){
    //   await downloadFromArr(listGFS,'GFS');
    // }
    if(listEC){
        await downloadFromArr(listEC,'ECMWF');
      }
  }catch(err){
    console.error('download list error,lin86')
    console.error(err);
    throw err;
  }
  return 'success '+moment().format('YYYY-MM-DD hh:mm:ss');
};

async function downloadFromArr(list, model){
  if(list){
    let downloadList = [];//需要下载的数据
    try{
      for(let url of list){
        // let RegArr = /(\d{4}\/\d{8}\/)(.*?xml$)/.exec(url);
        let RegArr = /(\d{4}\/\d{8}\/)(.*?\..*?$)/.exec(url);
        //0: "2019/20190306/z_tigge_c_kwbc_20190306000000_CENS_glob_prod_esttr_glo.xml"
        // 1: "2019/20190306/"
        // 2: "z_tigge_c_kwbc_20190306000000_CENS_glob_prod_esttr_glo.xml"
        if(!RegArr) return console.error('匹配URL路径错误:'+url);
        let dirPath = path.resolve(__dirname+`./../../data/cyclone/${iConfig.dir}/`,RegArr[1]);
        if(model=='custom'){
          dirPath = path.resolve(__dirname+`./../../data/cyclone/${iConfig.dir}/`);
        }
        await pMakeDir(dirPath);//创建不存在的目录
        const filePath = path.resolve(dirPath,RegArr[2]);
        let isFileExists = await isExists(filePath);// 判断文件是否存在
        if(!isFileExists){
          downloadList.push({url:baseUrl+url,filePath:filePath,model:model});
        }else{
          myDebug(`文件已存在${RegArr[2]}`);
          continue;
        }
      }
    }
    catch(err){
      console.error(err);
      throw err;
    }
    try{//控制并发下载
      // await pMap(downloadList,getDataFromXML, {concurrency: 5});
      let result = await pMap(downloadList,getDataFromXML, {concurrency: 1});
      console.log(result);
    }
    catch(err){
      console.error('pMap发生错误');
      throw err;
    }
  }
}

async function getDataFromXML({url,filePath,model}){
  let xml;
  try{
    console.log('ready to download '+url);
    // xml = await downloadXML(url,filePath);
    await downloadXML(url,filePath);
  }catch(err){
    console.error('download xml error, line 145');
    // throw err;
    return await getDataFromXML({url:url,filePath:filePath});
  }
  // let transData = await resolveCXML(xml).catch(err=>{throw err});

  // console.log(`resolved: ${url.match(/z_tigge.*?xml/)}`);
  // for(let tc of transData){
  //   tc.tcID = `${moment(tc.initTime).format('YYYYMMDDHH')}_${tc.cycloneName}_${tc.cycloneNumber}${tc.basinShort2}_${modelConfig[model].name}`;
  //   tc.fillStatus = modelConfig[model].modelType;
  //   await save2DB(tc).catch(err=>{throw err});
  // }
  return url;
}

/**
 * 
 * @param {String} url 下载地址
 * @param {String} filePath 需要下载到的目录
 * @param {Function} callBack 需要调用获取的数据的函数
 * @param {String} model model = ...['GEFS','GFS','MOGREPS','CMC','CENS','JMA-GSM','JMA-GEPS']
 */
async function downloadXML(url,filePath='../../data/cyclone/necp',model='GEFS') {
  let options = {
    uri: url,
    jar: cookiejar, // Tells rp to include cookies in jar that match uri
    timeout:70*1000,
    encoding: null,
    proxy: proxy,
  };
  let body;
  try {
    body = await rp(options);
    // console.log(`已下载 ${url}`);
    
  } catch (err) {
    throw err;
  }
  writeFile(filePath,body)
    .catch(err=>{
      console.error(err);
    })
  return body;
}

/**
 * 初始化
 */
// async function initDB(){
//   await connect();
//   initSchemas();
//   save2DB = require('./db/util.db').save2DB;
//   // return await main();
//   return main().catch(err=>{
//     console.error(err);
//     return awaitNext();
//   });
// }


async function main(){
  // let nowMonth = moment().format('YYMM');
  // let preMonth = moment().subtract(1,'months').format('YYMM');
  // let ncepBase = 'https://rda.ucar.edu/data/ds330.3/index.html?g=6';
  // let ukomBase = 'https://rda.ucar.edu/data/ds330.3/index.html?g=5';
  // console.log(nowMonth,preMonth);
  // let ecBase = 'https://rda.ucar.edu/data/ds330.3/index.html?g=4';
  // let jmaBase = 'https://rda.ucar.edu/data/ds330.3/index.html?g=8';
  // let mfiBase = 'https://rda.ucar.edu/data/ds330.3/index.html?g=7';
  let base = iConfig.base;
  let initTime = moment(iConfig.initTime,'YYYYMM');
  let nowTime = iConfig.finalTime? moment(iConfig.finalTime,'YYYYMM'): moment();
  let result;
  let months = nowTime.diff(initTime, 'months');
  try{
    for(let iMon = 0; iMon<= months; iMon++){
      let monthBase = moment(nowTime).subtract(iMon,'months').format('YYMM');
      console.log(monthBase);
      result = await rqMonthList(base+monthBase);
      console.log('Completed ' + result);
    }
    // result = await rqMonthList(ncepBase+nowMonth);
    // console.log('Completed ' + result);
    // result = await rqMonthList(ncepBase+preMonth);
    // console.log('Completed ' + result);
    // return awaitNext(5);
  }catch(err){
    console.error(err);
    throw err;
  }
}

function awaitNext(min=0.1){
  console.log(`下一次扫描:${min}分钟以后`);
  return setTimeout(()=>main().catch(err=>{
    console.error(err);
    return awaitNext();
  }),min*60*1000);
}

// initDB()
//   .catch(err=>{
//     console.error(err);
//     return awaitNext();
//   })

// main().catch(err=>{
//        console.error(err);
//        return awaitNext();
// });

async function customDownload(){
  let list = [
    '/data/ds330.3/egrr/2011/20111103/z_tigge_c_egrr_20111103120000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2011/20111102/z_tigge_c_egrr_20111102120000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2011/20111104/z_tigge_c_egrr_20111104000000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2012/20121126/z_tigge_c_egrr_20121126120000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2014/20140314/z_tigge_c_egrr_20140314000000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2014/20140331/z_tigge_c_egrr_20140331120000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2014/20140915/z_tigge_c_egrr_20140915120000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2015/20150329/z_tigge_c_egrr_20150329120000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2017/20170731/z_tigge_c_egrr_20170731000000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2018/20180919/z_tigge_c_egrr_20180919000000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2018/20180916/z_tigge_c_egrr_20180916120000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2019/20190516/z_tigge_c_egrr_20190516000000_mogreps_glob_prod_etctr_glo.xml.gz',
    '/data/ds330.3/egrr/2019/20190517/z_tigge_c_egrr_20190517120000_mogreps_glob_prod_etctr_glo.xml.gz',
    // '/data/ds330.3/ecmf/2013/20130306/z_tigge_c_ecmf_20130306000000_ifs_glob_prod_all_glo.xml',
  ]
  downloadFromArr(list,'custom');
}

customDownload()