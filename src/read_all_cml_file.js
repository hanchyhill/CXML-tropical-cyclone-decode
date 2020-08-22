const glob = require('glob');
const promisify = require('util').promisify;
const {default: PQueue} = require('p-queue');
const ecCxmlResolve = require('./EC_cxml_resolve.js').ecCxmlResolve;
const fs = require('fs');

const pGlob = promisify(glob);
async function readFile(){
  const basePath = 'H:/data/cyclone/custom/ecmwf/';
  const globOpt = {
    cwd:basePath,
  };
  let fileList = await pGlob('**/*.xml', globOpt);

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