# TIGGE CXML Format tropical cyclone forecast data

## Institution 机构

| dir-Name |ins-flag| initTime   | endTime    | data Format | Institution-CN    |
| :----:   |:------:| :--------: | :--------: | :---------: | :---------------: |
| ecmwf    |  ecmf  | 2006-10-01 | 2020-06-12 |    xml      | 欧洲中期天气预报中心 |
| ncep     |  kwbc  | 2008-07-31 | 2020-07-16 |    xml      | 美国气象环境预报中心 |
| msc      |  kwbc  | 2008-07-31 | 2020-07-16 |    xml      | 加拿大气象局       |
| ukmo     |  egrr  | 2008-07-14 | 2020-06-30 |    xml.gz   | 英国气象局         |
| jma      |  RJTD  | 2008-07-07 | 2020-06-30 | 2008->xml, since 2009 -> xml.gz | 日本气象厅 |
| mfi      |  lfpw  | 2011-01-30 | 2020-07-14 |    xml      | 法国气象局         |
| cma      |  babj  | 2008-07-25 | 2014-12-08 |    xml      | 中国气象局         |
| kma      |  rksl  | 2008-07-15 | 2010-10-30 |    xml      | 韩国气象厅         |

## TODO

* 解析报文
* 录入最佳路径
* 最佳路径与预报匹配

## 过滤规则

* ECMWF cycloneNumber < 70 OR cycloneNumber > 89
* UKMO cycloneNumber not Empty  

## 注意事项

* UKMO 的集合成员数发生过变化, UKMO数据添加了ensNumbers字段表示总的集合成员数量

## 数据异常

UKMO:

无法读取经纬度: \ukmo\2016\20160831\z_tigge_c_egrr_20160831000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016040700_*** _9980  96P_SH
无法读取经纬度: \ukmo\2016\20160912\z_tigge_c_egrr_20160912000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2015110312_*** _9980  CHAPALA_IO
无法读取经纬度: \ukmo\2016\20160912\z_tigge_c_egrr_20160912000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2015110312_*** _9980  CHAPALA_IO
无法读取经纬度: \ukmo\2016\20160912\z_tigge_c_egrr_20160912000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2015110312_*** _9980  CHAPALA_IO
无法读取经纬度: \ukmo\2017\20170707\z_tigge_c_egrr_20170707000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2015122800_*** _9980  92P_SH
无法读取经纬度: \ukmo\2017\20170722\z_tigge_c_egrr_20170722120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017052800_*** _9980  02B_IO
无法读取经纬度: \ukmo\2017\20170723\z_tigge_c_egrr_20170723000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016083100_*** _9980  LIONROCK_WP
无法读取经纬度: \ukmo\2017\20170723\z_tigge_c_egrr_20170723000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016083100_*** _9980  LIONROCK_WP
无法读取经纬度: \ukmo\2017\20170723\z_tigge_c_egrr_20170723000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016083100_*** _9980  LIONROCK_WP
无法读取经纬度: \ukmo\2017\20170723\z_tigge_c_egrr_20170723000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016083100_*** _9980  LIONROCK_WP
无法读取经纬度: \ukmo\2017\20170723\z_tigge_c_egrr_20170723000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016083100_*** _9980  LIONROCK_WP
无法读取经纬度: \ukmo\2017\20170723\z_tigge_c_egrr_20170723000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016083100_*** _9980  LIONROCK_WP
无法读取经纬度: \ukmo\2017\20170723\z_tigge_c_egrr_20170723000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016083100_*** _9980  LIONROCK_WP
无法读取经纬度: \ukmo\2017\20170723\z_tigge_c_egrr_20170723000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016083100_*** _9980  LIONROCK_WP
无法读取经纬度: \ukmo\2017\20171020\z_tigge_c_egrr_20171020000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017070612_*** _9980  91W_WP
无法读取经纬度: \ukmo\2017\20171020\z_tigge_c_egrr_20171020000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017070612_*** _9980  91W_WP
无法读取经纬度: \ukmo\2017\20171020\z_tigge_c_egrr_20171020000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017070612_*** _9980  91W_WP
无法读取经纬度: \ukmo\2017\20171020\z_tigge_c_egrr_20171020000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017070612_*** _9980  91W_WP
无法读取经纬度: \ukmo\2017\20171215\z_tigge_c_egrr_20171215120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017070700_*** _9980  91W_WP
无法读取经纬度: \ukmo\2017\20171215\z_tigge_c_egrr_20171215120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017070700_*** _9980  91W_WP
无法读取经纬度: \ukmo\2017\20171215\z_tigge_c_egrr_20171215120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017070700_*** _9980  91W_WP
无法读取经纬度: \ukmo\2017\20171215\z_tigge_c_egrr_20171215120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017070700_*** _9980  91W_WP
无法读取经纬度: \ukmo\2018\20180112\z_tigge_c_egrr_20180112000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016091200_*** _9980  17W_WP
无法读取经纬度: \ukmo\2018\20180112\z_tigge_c_egrr_20180112000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016091200_*** _9980  17W_WP
无法读取经纬度: \ukmo\2018\20180113\z_tigge_c_egrr_20180113120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016110400_*** _9980  TD_WP
无法读取经纬度: \ukmo\2018\20180113\z_tigge_c_egrr_20180113120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016110400_*** _9980  TD_WP
无法读取经纬度: \ukmo\2018\20180113\z_tigge_c_egrr_20180113120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2016110400_*** _9980  TD_WP
无法读取经纬度: \ukmo\2018\20180116\z_tigge_c_egrr_20180116000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017080400_*** _9980  98W_WP
无法读取经纬度: \ukmo\2018\20180116\z_tigge_c_egrr_20180116000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017080400_*** _9980  98W_WP
无法读取经纬度: \ukmo\2018\20180116\z_tigge_c_egrr_20180116000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017080400_*** _9980  98W_WP
无法读取经纬度: \ukmo\2018\20180116\z_tigge_c_egrr_20180116000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017080400_*** _9980  98W_WP
无法读取经纬度: \ukmo\2018\20180116\z_tigge_c_egrr_20180116000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017080400_*** _9980  98W_WP
无法读取经纬度: \ukmo\2018\20180116\z_tigge_c_egrr_20180116000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017080400_*** _9980  98W_WP
无法读取经纬度: \ukmo\2018\20180321\z_tigge_c_egrr_20180321120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017102000_*** _9980  26W_WP
无法读取经纬度: \ukmo\2018\20180321\z_tigge_c_egrr_20180321120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017102000_*** _9980  26W_WP
无法读取经纬度: \ukmo\2018\20180321\z_tigge_c_egrr_20180321120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017102000_*** _9980  26W_WP
无法读取经纬度: \ukmo\2018\20181210\z_tigge_c_egrr_20181210000000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017072206_*** _9980  ROKE_WP
无法读取经纬度: \ukmo\2019\20190103\z_tigge_c_egrr_20190103120000_mogreps_glob_prod_etctr_glo.xml.gz -> 2017072300_*** _9980  ROKE_WP


### 数据不完整

以下数据在rda.ucar.edu数据集中文件不完整:

ECMWF:

* z_tigge_c_ecmf_20150716120000_ifs_glob_prod_all_glo.xml(已从ECMWF官网补全)
* z_tigge_c_ecmf_20161112000000_ifs_glob_prod_all_glo.xml(已从ECMWF官网补全)

NCEP:

* /2016/20160121/z_tigge_c_kwbc_20160121000000_GFS_glob_prod_sttr_glo.xml
* /2016/20160123/z_tigge_c_kwbc_20160123000000_GFS_glob_prod_sttr_glo.xml
* /2017/20171003/z_tigge_c_kwbc_20171003180000_GFS_glob_prod_sttr_glo.xml
* z_tigge_c_kwbc_20160123000000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20160527180000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20160121180000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20160122180000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20160528180000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20171003180000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20180326000000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20190825000000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20190825060000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20190824120000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20190825120000_GEFS_glob_prod_esttr_glo.xml
* z_tigge_c_kwbc_20190825180000_GEFS_glob_prod_esttr_glo.xml
  
MSC:

* /2016/20160218/z_tigge_c_kwbc_20160218000000_CMC_glob_prod_sttr_glo.xml

UKMO:
* 异常文件：H:/data/cyclone/ukmo/2011/20111103/z_tigge_c_egrr_20111103120000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2011/20111102/z_tigge_c_egrr_20111102120000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2011/20111104/z_tigge_c_egrr_20111104000000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2012/20121126/z_tigge_c_egrr_20121126120000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2014/20140314/z_tigge_c_egrr_20140314000000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2014/20140331/z_tigge_c_egrr_20140331120000_mogreps_glob_prod_etctr_glo.xml.gz(部分缺失，通过删除异常部分修复了数据) 
* 异常文件：H:/data/cyclone/ukmo/2014/20140915/z_tigge_c_egrr_20140915120000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2015/20150329/z_tigge_c_egrr_20150329120000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2017/20170731/z_tigge_c_egrr_20170731000000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2018/20180919/z_tigge_c_egrr_20180919000000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2018/20180916/z_tigge_c_egrr_20180916120000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2019/20190516/z_tigge_c_egrr_20190516000000_mogreps_glob_prod_etctr_glo.xml.gz
* 异常文件：H:/data/cyclone/ukmo/2019/20190517/z_tigge_c_egrr_20190517120000_mogreps_glob_prod_etctr_glo.xml.gz

### 空数据

ECMWF: 
* z_tigge_c_ecmf_20130120000000_ifs_glob_prod_all_glo.xml
* z_tigge_c_ecmf_20130209120000_ifs_glob_prod_all_glo.xml
* z_tigge_c_ecmf_20130305120000_ifs_glob_prod_all_glo.xml
* z_tigge_c_ecmf_20130306000000_ifs_glob_prod_all_glo.xml
* z_tigge_c_ecmf_20131214120000_ifs_glob_prod_all_glo.xml
* z_tigge_c_ecmf_20131215000000_ifs_glob_prod_all_glo.xml
* z_tigge_c_ecmf_20131215120000_ifs_glob_prod_all_glo.xml
* z_tigge_c_ecmf_20131216000000_ifs_glob_prod_all_glo.xml
* z_tigge_c_ecmf_20140122120000_ifs_glob_prod_all_glo.xml
* z_tigge_c_ecmf_20140123000000_ifs_glob_prod_all_glo.xml