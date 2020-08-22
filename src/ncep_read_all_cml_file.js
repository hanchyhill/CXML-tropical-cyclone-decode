const glob = require('glob');
const promisify = require('util').promisify;
const {default: PQueue} = require('p-queue');
const resolveCXML = require('./NCEP_cxml_resolve.js').resolveCXML;
const fs = require('fs');

const pGlob = promisify(glob);
async function readFile(){
  const basePath = 'H:/data/cyclone/ncep/ncep2014/';
  const globOpt = {
    cwd:basePath,
  };
  let fileList = await pGlob('**/*_GFS_*.xml', globOpt);

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
      fs.appendFile('./custom_resolve_log.txt',info+err.message+'\n',(error)=>{
        console.error(error);
      })
    }));
  }
  
}

readFile()
  .catch(err=>{
    throw err;
  })