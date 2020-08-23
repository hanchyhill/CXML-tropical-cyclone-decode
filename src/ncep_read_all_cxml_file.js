const glob = require('glob');
const promisify = require('util').promisify;
const {default: PQueue} = require('p-queue');
// const resolveCXML = require('./NCEP_cxml_resolve.js').resolveCXML;
// const resolveCXML = require('./MSC_cxml_resolve.js').resolveCXML;
const resolveCXML = require('./UKMOread.js').resolveCXML;
const fs = require('fs');
const path = require('path');
const pGlob = promisify(glob);

const config = {
  "ncep":{
    basePath: 'H:/data/cyclone/ncep/ncep2014/',
    customPath:'H:/data/cyclone/custom/ncep/',
    globExp: '**/*_GEFS_*.xml',
    globExp2: '**/*_GFS_*.xml',
    logFile: './logs/custom_resolve_NCEP_log.txt',
  },
  "msc":{
    basePath: 'H:/data/cyclone/msc/msc2014/',
    customPath:'H:/data/cyclone/custom/msc/',
    globExp: '**/*_CENS_*.xml',
    globExp2: '**/*_CMC_*.xml',
    logFile: path.resolve(__dirname,'./logs/custom_resolve_MSC_log.txt'),
  },
  "ukmo":{
    basePath: 'H:/data/cyclone/ukmo/',
    customPath:'H:/data/cyclone/custom/ukmo/',
    globExp: '**/*.xml.gz',
    logFile: path.resolve(__dirname,'./logs/custom_resolve_ukmo_log.txt'),
  }
}

let iConfig = config.ukmo;
async function readFile(){
  // const basePath = 'H:/data/cyclone/ncep/ncep2014/';
  const basePath = iConfig.customPath;
  const globOpt = {
    cwd:basePath,
  };
  let fileList = await pGlob(iConfig.globExp, globOpt);
  return queueFile(fileList, basePath);
}

/**
 * 执行文件队列
 * @param {Array} fileList 文件列表，形如2015/20150401/z_tigge_c_egrr_20150401000000_mogreps_glob_prod_etctr_glo.xml
 * @param {String} basePath 路径
 */
function queueFile(fileList=[], basePath = iConfig.basePath){
  const queue = new PQueue({concurrency: 10});
  let count = 0;
  queue.on('active', () => {
    let info = `Working on item #${++count}.  Size: ${queue.size}  Pending: ${queue.pending}`;
    console.log(info);
  });
  for(let filePath of fileList){
    let fileURI = path.resolve(basePath, filePath);
    queue.add(()=>resolveCXML(fileURI).catch(err=>{
      let info = '异常文件：' + fileURI;
      console.log(info);
      fs.appendFile(iConfig.logFile, info + ' '+err.message+'\n',(error)=>{
        console.trace(error);
      })
    }));
  }
}

function customFilePool(){
  let fileList = [
    '2015/20150401/z_tigge_c_egrr_20150401000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2015/20151103/z_tigge_c_egrr_20151103120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2015/20151228/z_tigge_c_egrr_20151228000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2015/20151231/z_tigge_c_egrr_20151231120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2015/20151231/z_tigge_c_egrr_20151231000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2016/20160101/z_tigge_c_egrr_20160101000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2016/20160115/z_tigge_c_egrr_20160115120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2016/20160115/z_tigge_c_egrr_20160115000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2016/20160407/z_tigge_c_egrr_20160407000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2016/20160831/z_tigge_c_egrr_20160831000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2016/20160912/z_tigge_c_egrr_20160912000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2016/20161104/z_tigge_c_egrr_20161104000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20170101/z_tigge_c_egrr_20170101120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20170411/z_tigge_c_egrr_20170411120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20170410/z_tigge_c_egrr_20170410000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20170528/z_tigge_c_egrr_20170528000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20170706/z_tigge_c_egrr_20170706120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20170707/z_tigge_c_egrr_20170707000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20170722/z_tigge_c_egrr_20170722120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20170723/z_tigge_c_egrr_20170723000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20170804/z_tigge_c_egrr_20170804000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20171020/z_tigge_c_egrr_20171020000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2017/20171215/z_tigge_c_egrr_20171215120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20180112/z_tigge_c_egrr_20180112000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20180113/z_tigge_c_egrr_20180113000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20180113/z_tigge_c_egrr_20180113120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20180114/z_tigge_c_egrr_20180114000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20180115/z_tigge_c_egrr_20180115120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20180116/z_tigge_c_egrr_20180116000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20180321/z_tigge_c_egrr_20180321120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20180322/z_tigge_c_egrr_20180322000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20180921/z_tigge_c_egrr_20180921000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20181014/z_tigge_c_egrr_20181014000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20181209/z_tigge_c_egrr_20181209000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20181209/z_tigge_c_egrr_20181209120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2018/20181210/z_tigge_c_egrr_20181210000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2019/20190103/z_tigge_c_egrr_20190103120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2019/20190106/z_tigge_c_egrr_20190106000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2019/20190108/z_tigge_c_egrr_20190108000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2019/20190507/z_tigge_c_egrr_20190507000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2019/20190507/z_tigge_c_egrr_20190507120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2019/20191123/z_tigge_c_egrr_20191123000000_mogreps_glob_prod_etctr_glo.xml.gz',
'2019/20191123/z_tigge_c_egrr_20191123120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2020/20200429/z_tigge_c_egrr_20200429120000_mogreps_glob_prod_etctr_glo.xml.gz',
'2020/20200429/z_tigge_c_egrr_20200429000000_mogreps_glob_prod_etctr_glo.xml.gz',
  ];
  return queueFile(fileList, iConfig.basePath);
}

// readFile()
//   .catch(err=>{
//     throw err;
//   })
customFilePool();