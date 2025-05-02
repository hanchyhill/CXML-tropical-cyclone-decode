# import sys
import os
import json
import asyncio
import aiohttp
from aiohttp import ClientSession
from asyncio import Semaphore
from tqdm.asyncio import tqdm
from tqdm import tqdm as std_tqdm

# 设置下载目录
ins = "ecmwf"
DOWNLOAD_DIR = r"H:\data\cyclone\cxml_new\{}".format(ins)

# 确保下载目录存在
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# 从json文件导入数组
file_list_path = os.path.join(os.path.dirname(__file__), f'filelist_{ins}.json')
with open(file_list_path, 'r') as f:
    filelist = json.load(f)

async def download_file(session: ClientSession, url: str, semaphore: Semaphore, pbar: std_tqdm):
    async with semaphore:
        ofile = os.path.basename(url)
        output_path = os.path.join(DOWNLOAD_DIR, ofile)
        
        # 检查文件是否已存在
        if os.path.exists(output_path):
            pbar.write(f"Skipping {ofile}: File already exists")
            pbar.update(1)
            return
            
        temp_path = output_path + '.tmp'
        
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    total_size = int(response.headers.get('content-length', 0))
                    
                    # 创建单个文件的进度条
                    with open(temp_path, 'wb') as f:
                        with tqdm(total=total_size, unit='B', unit_scale=True, 
                                desc=ofile, leave=False) as file_pbar:
                            async for chunk in response.content.iter_chunked(8192):
                                f.write(chunk)
                                file_pbar.update(len(chunk))
                    
                    # 下载完成后重命名文件
                    os.rename(temp_path, output_path)
                    pbar.update(1)
                else:
                    pbar.write(f"Failed to download {ofile}: HTTP {response.status}")
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
        except Exception as e:
            pbar.write(f"Error downloading {ofile}: {str(e)}")
            if os.path.exists(temp_path):
                os.remove(temp_path)

async def main():
    # 创建信号量来限制并发数
    semaphore = Semaphore(10)
    
    # 创建总体进度条
    with tqdm(total=len(filelist), desc="Total Progress", unit="files") as pbar:
        async with aiohttp.ClientSession() as session:
            # 创建所有下载任务
            tasks = [download_file(session, url, semaphore, pbar) for url in filelist]
            # 等待所有任务完成
            await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
