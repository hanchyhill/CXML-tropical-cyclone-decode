const glob = require('glob');
const promisify = require('util').promisify;
const {default: PQueue} = require('p-queue');
const ecCxmlResolve = require('./EC_cxml_resolve.js').ecCxmlResolve;
const fs = require('fs');

const pGlob = promisify(glob);

// 时间范围配置：格式 YYYYMMDDHHmmss，设为 null 表示不限制该边界
const startTime = null; // 例如：20240324000000
const endTime = null;   // 例如：20240324235959

function getFileTimeFromName(filePath){
  const fileName = filePath.split(/[\\/]/).pop() || '';
  const match = fileName.match(/_(\d{14})_/);
  return match ? Number(match[1]) : null;
}

function isInTimeRange(filePath){
  const fileTime = getFileTimeFromName(filePath);
  if (fileTime === null) return false;
  if (startTime !== null && fileTime < startTime) return false;
  if (endTime !== null && fileTime > endTime) return false;
  return true;
}

async function readFile(){
  const basePath = 'H:/data/cyclone/cxml_new/ecmwf/'//'F:/github/data/cyclone/ecmwf/';
  const globOpt = {
    cwd:basePath,
  };
  let fileList = await pGlob('**/*.xml', globOpt);
  fileList = fileList.filter(isInTimeRange);
  console.log(`筛选后文件数量: ${fileList.length}`);

  // for(let filePath of fileList){
  //    let fileURI = basePath + filePath;
  //    try{
  //      await ecCxmlResolve(fileURI);
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
    queue.add(()=>ecCxmlResolve(fileURI).catch(err=>{
      let info = '异常文件：' + fileURI;
      console.error(err);
      fs.appendFile('./custom_resolve_ecmwf_log.txt',info+err.message+'\n',(error)=>{
        console.error(error);
      })
    }));
  }
  
}

readFile()
  .catch(err=>{
    throw err;
  })