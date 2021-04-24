const path = require("path");
const fs = require("fs");
const promisify = require("util").promisify;
const pReaddir = promisify(fs.readdir);
const pStat = promisify(fs.stat);
const pWriteFile = promisify(fs.writeFile);

const dirPath = 'H:/data/cyclone/json_format/ecmwf'
async function main() {
  let fileList = await pReaddir(dirPath);
  let outPutArr = []
  for (let fileName of fileList) {
    const fileStat = await pStat(path.join(dirPath, fileName));
    if (fileStat.isFile()) {
      let fileInfo = fileName.replace('.json', '').split('_');
      let time = fileInfo[0];
      let basin = fileInfo[2].replace(/\d/g,'');
      let tcNumber = fileInfo[2].match(/\d*/);
      let fileDes = {
        file: fileName,
        tcName: fileInfo[1],
        tcNumber:tcNumber?tcNumber[0]:'',
        basin,
        ins: fileInfo[3].toLowerCase(),
        time,
        year: Number.parseInt(time.slice(0,4)),
        month:Number.parseInt(time.slice(4,6)),
        day:Number.parseInt(time.slice(6,8)),
        hour:Number.parseInt(time.slice(8,10)),
      }
      outPutArr.push(fileDes);
    }
  }
  await pWriteFile('H:/data/cyclone/json_format/ecmwfCycloneInfo.json', JSON.stringify(outPutArr,null,2));
}
main()
  .catch(err =>
    console.error(err))

