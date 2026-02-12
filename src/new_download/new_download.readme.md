
## NCEP和CMC，kwbc Tropical Cyclone Track data for 2021-12，按照月份下载
https://gdex.ucar.edu/datasets/d330003/filelist/62112/
其中2112表示21年12月

检索
https://osdf-director.osg-htc.org/ncar/gdex/d330003/kwbc/2021/20211206/z_tigge_c_kwbc_20211206000000_GEFS_glob_prod_esttr_glo.xml
`http.*?xml`
去重
下载就行

## EC 按照年份下载
https://gdex.ucar.edu/datasets/d330003/filelist/425

检索
`http.*?xml`
去重
下载就行

## 下载NCEP数据流程

1. 读取NCEP数据文件列表
baseURL = https://gdex.ucar.edu/datasets/d330003/filelist/6
2. 按照日期依次遍历，日期从2020年1月开始，到2025年12月结束
3. 每次遍历获取当月数据列表，设需要遍历的日期为target_date, target_date.format('YYMM')为target_date_str
4. 根据target_date_str，构造url：https://gdex.ucar.edu/datasets/d330003/filelist/6{target_date_str}
5. 请求url，会得到html文件
6. 在html文件中，找到所有`http.*?xml`（正则表达式匹配）的url，这些url就是需要下载的文件列表。
7. 使用filter(url=>url.includes('_GEFS_'))，过滤出GEFS文件列表, 文件保存在目录`H:\data\cyclone\cxml_new\ncep`的子目录中，分月份保存，比如2021年12月，文件保存在目录`H:\data\cyclone\cxml_new\ncep\202112`中。
8. 使用filter(url=>url.includes('_GFS_'))，过滤出GFS文件列表, 文件保存在目录`H:\data\cyclone\cxml_new\ncep`的子目录中，分月份保存，比如2021年12月，文件保存在目录`H:\data\cyclone\cxml_new\ncep\202112`中。
9. 使用filter(url=>url.includes('_CENS_'))，过滤出CENS文件列表, 文件保存在目录`H:\data\cyclone\cxml_new\msc`的子目录中，分月份保存，比如2021年12月，文件保存在目录`H:\data\cyclone\cxml_new\msc\202112`中。
10. 使用filter(url=>url.includes('_CMC_'))，过滤出CMC文件列表, 文件保存在目录`H:\data\cyclone\cxml_new\msc`的子目录中，分月份保存，比如2021年12月，文件保存在目录`H:\data\cyclone\cxml_new\msc\202112`中。
11. 下载文件时使用`p-map`控制并发数量，
12. 保存文件时，先判断目录是否存在，并尝试创建目录。

## 下载EC数据
EC 按照年份下载
baseURL = https://gdex.ucar.edu/datasets/d330003/filelist/4
1. 读取EC数据文件列表
2. 按照年份依次遍历，年份从2022年开始，到2025年结束
3. 每次遍历获取当年数据列表，设需要遍历的年份为target_year, target_year.format('YY')为target_year_str，比如2022年，target_year_str为22
4. 根据target_year_str，构造url：https://gdex.ucar.edu/datasets/d330003/filelist/4{target_year_str}
5. 请求url，会得到html文件
6. 在html文件中，找到所有`http.*?xml`（正则表达式匹配）的url，这些url就是需要下载的文件列表。
7. 使用filter(url=>url.includes('_IFS_'))，过滤出EC文件列表, 文件保存在目录`H:\data\cyclone\cxml_new\ecmwf`中，不需要分年份保存。
8. 下载文件时使用`p-map`控制并发数量，
9. 保存文件时，先判断目录是否存在，并尝试创建目录。

## 配置化下载（download_cxml_new.js）

脚本支持通过 `DOWNLOAD_CONFIG` 灵活控制：

1. 选择下载数据源：`sources[].enabled`
2. 选择下载模型：`sources[].models[].enabled`
3. 设置时间范围：
   - 月度源：`timeType='month'`，使用 `start='YYYYMM'` / `end='YYYYMM'`
   - 年度源：`timeType='year'`，使用 `start=YYYY` / `end=YYYY`
4. 设置下载并发：`DOWNLOAD_CONFIG.concurrency`

### 当前默认配置

- `ncep_msc_monthly`
  - 列表地址：`https://gdex.ucar.edu/datasets/d330003/filelist/6`
  - 时间范围：`202101` 到 `202512`
  - 模型：`GEFS/GFS/CENS/CMC`
  - 输出：按月份子目录保存
- `ecmwf_yearly`
  - 列表地址：`https://gdex.ucar.edu/datasets/d330003/filelist/4`
  - 时间范围：`2022` 到 `2025`
  - 模型：`IFS`
  - 输出：`H:\data\cyclone\cxml_new\ecmwf`（不分年份）

