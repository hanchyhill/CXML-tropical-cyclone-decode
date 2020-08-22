const glob = require('glob');
const promisify = require('util').promisify;
const {default: PQueue} = require('p-queue');
// const resolveCXML = require('./NCEP_cxml_resolve.js').resolveCXML;
const resolveCXML = require('./MSC_cxml_resolve.js').resolveCXML;
const fs = require('fs');

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
    logFile: './logs/custom_resolve_MSC_log.txt',
  }
}

let iConfig = config.msc;
async function readFile(){
  // const basePath = 'H:/data/cyclone/ncep/ncep2014/';
  const basePath = iConfig.basePath;
  const globOpt = {
    cwd:basePath,
  };
  let fileList = await pGlob(iConfig.globExp, globOpt);

  // for(let filePath of fileList){
  //    let fileURI = basePath + filePath;
  //    try{
  //      await resolveCXML(fileURI);
  //    }catch (e){
  //      console.error(fileURI);
  //    }
  // }
  const queue = new PQueue({concurrency: 10});
  let count = 0;
  queue.on('active', () => {
    let info = `Working on item #${++count}.  Size: ${queue.size}  Pending: ${queue.pending}`;
    console.log(info);
    // fs.appendFile('./ec_resolve_log.txt',info+'\n',(err)=>{
    //   // console.error(err);
    // })
  });
  for(let filePath of fileList){
    let fileURI = basePath + filePath;
    queue.add(()=>resolveCXML(fileURI).catch(err=>{
      let info = '异常文件：' + fileURI;
      console.error(err);
      fs.appendFile('./custom_resolve_log.txt',info + ' '+err.message+'\n',(error)=>{
        console.error(error);
      })
    }));
  }
  
}

readFile()
  .catch(err=>{
    throw err;
  })