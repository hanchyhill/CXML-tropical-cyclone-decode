const rp = require('request-promise-native');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const moment = require('moment');
const pMap = require('p-map');
const util = require('util');
const xml2js = require('xml2js');

/**
 * 下载配置：
 * 1) enabled 控制是否启用数据源
 * 2) model.enabled 控制是否启用某个模式
 * 3) start/end 控制时间范围
 * 4) validateExistingXml.enabled 控制是否校验已存在 XML 的合法性
 */
const DOWNLOAD_CONFIG = {
  concurrency: 5,
  validateExistingXml: {
    enabled: false,// 会自动跳过gz文件的检查
  },
  sources: [
    {
      id: 'ncep_msc_monthly',
      enabled: false,
      listBaseUrl: 'https://gdex.ucar.edu/datasets/d330003/filelist/6',
      timeType: 'month',
      start: '202101',
      end: '202512',
      models: [
        {
          id: 'gefs',
          enabled: true,
          keyword: '_GEFS_',
          outputRoot: 'H:\\data\\cyclone\\cxml_new\\ncep',
          withTimeSubDir: true,
        },
        {
          id: 'gfs',
          enabled: true,
          keyword: '_GFS_',
          outputRoot: 'H:\\data\\cyclone\\cxml_new\\ncep',
          withTimeSubDir: true,
        },
        {
          id: 'cens',
          enabled: true,
          keyword: '_CENS_',
          outputRoot: 'H:\\data\\cyclone\\cxml_new\\msc',
          withTimeSubDir: true,
        },
        {
          id: 'cmc',
          enabled: true,
          keyword: '_CMC_',
          outputRoot: 'H:\\data\\cyclone\\cxml_new\\msc',
          withTimeSubDir: true,
        },
      ],
    },
    {
      id: 'ECMWF',// 欧洲中心
      enabled: false,
      listBaseUrl: 'https://gdex.ucar.edu/datasets/d330003/filelist/4',
      timeType: 'year',
      start: 2026,
      end: 2026,
      models: [
        {
          id: 'ifs',
          enabled: true,
          keyword: '_IFS_',
          outputRoot: 'H:\\data\\cyclone\\cxml_new\\ecmwf',
          withTimeSubDir: false,
        },
      ],
    },
    {
      id: 'RJTD',// 日本
      enabled: true,
      listBaseUrl: 'https://gdex.ucar.edu/datasets/d330003/filelist/8',
      timeType: 'year',
      start: 2022,
      end: 2025,
      models: [
        {
          id: 'jma-gsm',
          enabled: true,
          keyword: 'RJTD',
          outputRoot: 'H:\\data\\cyclone\\cxml_new\\jma',
          withTimeSubDir: true,
        },
      ],
    },
    {
      id: 'UKMO', // 英国
      enabled: true,
      listBaseUrl: 'https://gdex.ucar.edu/datasets/d330003/filelist/5',
      timeType: 'month',
      start: '202101',
      end: '202512',
      models: [
        {
          id: 'egrr',
          enabled: true,
          keyword: 'egrr',
          outputRoot: 'H:\\data\\cyclone\\cxml_new\\ukmo',
          withTimeSubDir: true,
        },
      ],
    },
    {
      id: 'KMA',// 韩国
      enabled: true,
      listBaseUrl: 'https://gdex.ucar.edu/datasets/d330003/filelist/9',
      timeType: 'year',
      start: 2022,
      end: 2025,
      models: [
        {
          id: 'rksl',
          enabled: true,
          keyword: 'rksl',
          outputRoot: 'H:\\data\\cyclone\\cxml_new\\kma',
          withTimeSubDir: true,
        },
      ],
    },
    {
      id: 'MFI',// 法国
      enabled: true,
      listBaseUrl: 'https://gdex.ucar.edu/datasets/d330003/filelist/7',
      timeType: 'year',
      start: 2022,
      end: 2025,
      models: [
        {
          id: 'lfpw',
          enabled: true,
          keyword: 'lfpw',
          outputRoot: 'H:\\data\\cyclone\\cxml_new\\mfi',
          withTimeSubDir: true,
        },
      ],
    },
    {
      id: 'CMA',// 中国气象局
      enabled: true,
      listBaseUrl: 'https://gdex.ucar.edu/datasets/d330003/filelist/2',
      timeType: 'year',
      start: 2022,
      end: 2025,
      models: [
        {
          id: 'babj',
          enabled: true,
          keyword: 'babj',
          outputRoot: 'H:\\data\\cyclone\\cxml_new\\cma',
          withTimeSubDir: true,
        },
      ],
    },
  ],
};

// 代理服务器ip和端口
const proxy_ip = '127.0.0.1';
const proxy_port = 10809;
const proxy = util.format('http://%s:%d', proxy_ip, proxy_port);

/**
 * 读取列表页面中的全部可下载链接（xml/gz，去重后返回）
 * @param {string} listUrl 列表地址
 * @returns {Promise<string[]>}
 */
async function fetchDownloadUrlsFromList(listUrl) {
  const html = await rp({
    uri: listUrl,
    timeout: 70 * 1000,
    proxy,
  });

  const fileMatches =
    html.match(/https?:\/\/[^\s"'<>]+?\.(?:xml\.gz|xml|gz)(?=$|[?#\s"'<>])/gi) || [];
  return [...new Set(fileMatches)];
}

/**
 * 验证本地 XML 文件格式是否合法
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
async function isXmlFileValid(filePath) {
  try {
    const xmlText = await fsp.readFile(filePath, 'utf8');
    if (!xmlText || !xmlText.trim()) {
      return false;
    }
    const parser = new xml2js.Parser({ strict: true });
    await parser.parseStringPromise(xmlText);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 下载文件并保存到目标路径
 * @param {{url: string, filePath: string, modelId: string}} task
 * @param {{index: number, total: number, periodLabel: string}} context
 * @returns {Promise<'ok'|'skip'>}
 */
async function downloadOne({ url, filePath }, { index, total, periodLabel }) {
  const seq = `${index + 1}/${total}`;
  const fileName = path.basename(filePath);
  const exists = fs.existsSync(filePath);
  if (exists) {
    const isGzipFile = path.extname(filePath).toLowerCase() === '.gz';
    if (!DOWNLOAD_CONFIG.validateExistingXml.enabled) {
      console.log(`[${periodLabel}] [${seq}] [🤔]跳过(已存在): ${fileName}`);
      return 'skip';
    }

    if (isGzipFile) {
      console.log(`[${periodLabel}] [${seq}] [✅]跳过(已存在gz): ${fileName}`);
      return 'skip';
    }

    const isValid = await isXmlFileValid(filePath);
    if (isValid) {
      console.log(`[${periodLabel}] [${seq}] [✅]跳过(已存在且XML合法): ${fileName}`);
      return 'skip';
    }

    console.warn(
      `[${periodLabel}] [${seq}] [⚠️]已存在文件XML不合法，准备重下: ${fileName}`,
    );
    await fsp.unlink(filePath).catch((err) => {
      if (err && err.code !== 'ENOENT') {
        throw err;
      }
    });
  }

  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  console.log(`[${periodLabel}] [${seq}] [🚀]开始下载: ${fileName}`);
  const body = await rp({
    uri: url,
    timeout: 90 * 1000,
    encoding: null,
    proxy,
  });
  await fsp.writeFile(filePath, body);
  console.log(`[${periodLabel}] [${seq}] [🎉]下载完成: ${fileName}`);
  return 'ok';
}

/**
 * 格式化下载失败日志，帮助定位网络、代理、权限、远端状态等问题
 * @param {unknown} err
 * @returns {string}
 */
function formatDownloadError(err) {
  if (!err) return '未知错误';

  const details = [];
  if (err.message) details.push(`message=${err.message}`);
  if (err.statusCode) details.push(`statusCode=${err.statusCode}`);
  if (err.error && typeof err.error === 'string') {
    details.push(`response=${err.error.slice(0, 300)}`);
  }
  if (err.error && err.error.message) details.push(`error.message=${err.error.message}`);
  if (err.cause && err.cause.code) details.push(`cause.code=${err.cause.code}`);
  if (err.code) details.push(`code=${err.code}`);

  return details.join(' | ') || String(err);
}

/**
 * 按模型配置构建下载任务
 * @param {string[]} urls 当期提取出的链接数组
 * @param {string|number} period 当期标识（YYYYMM 或 YYYY）
 * @param {Array} models 模型配置
 * @returns {{byModel: Record<string, Array>, all: Array}}
 */
function buildTasksByModels(urls, period, models) {
  const byModel = {};
  const all = [];

  for (const model of models.filter((item) => item.enabled)) {
    const keywordLower = String(model.keyword || '').toLowerCase();
    const matched = urls
      .filter((url) => String(url).toLowerCase().includes(keywordLower))
      .map((url) => ({
        url,
        modelId: model.id,
        filePath: model.withTimeSubDir
          ? path.join(model.outputRoot, String(period), path.basename(url))
          : path.join(model.outputRoot, path.basename(url)),
      }));
    byModel[model.id] = matched;
    all.push(...matched);
  }

  return { byModel, all };
}

/**
 * 生成月份列表（含首尾）
 * @param {string} startMonth YYYYMM
 * @param {string} endMonth YYYYMM
 * @returns {string[]}
 */
function buildMonthList(startMonth, endMonth) {
  const start = moment(startMonth, 'YYYYMM');
  const end = moment(endMonth, 'YYYYMM');
  const totalMonths = end.diff(start, 'months');
  const months = [];

  for (let i = 0; i <= totalMonths; i += 1) {
    months.push(moment(start).add(i, 'months').format('YYYYMM'));
  }

  return months;
}

/**
 * 生成年份列表（含首尾）
 * @param {number} startYear
 * @param {number} endYear
 * @returns {number[]}
 */
function buildYearList(startYear, endYear) {
  const years = [];
  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }
  return years;
}

/**
 * 将 period 转换为 filelist 后缀
 * 月份：YYYYMM -> YYMM
 * 年份：YYYY -> YY
 * @param {string|number} period
 * @param {'month'|'year'} timeType
 * @returns {string}
 */
function toListUrlSuffix(period, timeType) {
  if (timeType === 'month') {
    return moment(String(period), 'YYYYMM').format('YYMM');
  }
  return moment(String(period), 'YYYY').format('YY');
}

async function runSource(sourceConfig) {
  const { id, listBaseUrl, timeType, start, end, models } = sourceConfig;
  const enabledModels = models.filter((item) => item.enabled);
  if (enabledModels.length === 0) {
    console.log(`数据源 ${id} 未启用任何模型，跳过`);
    return;
  }

  const periods =
    timeType === 'month'
      ? buildMonthList(start, end)
      : buildYearList(Number(start), Number(end));

  console.log(`\n数据源: ${id}`);
  console.log(`时间类型: ${timeType}`);
  console.log(`时间范围: ${start} -> ${end}`);
  console.log(`待处理时段数量: ${periods.length}`);
  console.log(`启用模型: ${enabledModels.map((item) => item.id).join(', ')}`);
  const sourceStats = enabledModels.reduce((acc, model) => {
    acc[model.id] = {
      total: { ok: 0, skip: 0, fail: 0 },
      byPeriod: {},
    };
    return acc;
  }, {});
  const listStats = {
    total: { ok: 0, fail: 0 },
    byPeriod: {},
  };

  for (const period of periods) {
    const suffix = toListUrlSuffix(period, timeType);
    const listUrl = `${listBaseUrl}${suffix}`;
    const periodLabel = `${id}:${period}`;

    console.log(`\n开始处理 ${periodLabel} -> ${listUrl}`);
    console.log(`[${periodLabel}] 正在请求列表...`);

    let urls = [];
    try {
      urls = await fetchDownloadUrlsFromList(listUrl);
      console.log(`[${periodLabel}] 列表请求成功，提取链接 ${urls.length} 条`);
      listStats.total.ok += 1;
      listStats.byPeriod[String(period)] = {
        status: 'ok',
        url: listUrl,
        urlCount: urls.length,
      };
    } catch (err) {
      console.error(`[${periodLabel}] [🚫]读取列表失败`);
      console.error(formatDownloadError(err));
      listStats.total.fail += 1;
      listStats.byPeriod[String(period)] = {
        status: 'fail',
        url: listUrl,
        error: formatDownloadError(err),
      };
      continue;
    }

    const { byModel, all } = buildTasksByModels(urls, period, models);
    const modelStats = enabledModels
      .map(
        (item) =>
          `${item.id.toUpperCase()}(keyword=${item.keyword})=${(byModel[item.id] || []).length}`,
      )
      .join(', ');
    console.log(`[${periodLabel}] 链接统计 total=${urls.length}, ${modelStats}`);

    if (all.length === 0) {
      console.log(`[${periodLabel}] [🤔]无匹配下载项，跳过`);
      continue;
    }

    console.log(`[${periodLabel}] [🎯]本期待下载任务数: ${all.length}`);
    const total = all.length;
    const results = await pMap(
      all,
      async (task, index) => {
        const taskContext = { index, total, periodLabel };
        try {
          const status = await downloadOne(task, taskContext);
          return { modelId: task.modelId, status };
        } catch (err) {
          console.error(`[${periodLabel}] [${index + 1}/${total}] [🚫]下载失败`);
          console.error(`model=${task.modelId} | url=${task.url}`);
          console.error(`target=${task.filePath}`);
          console.error(formatDownloadError(err));
          return { modelId: task.modelId, status: 'fail' };
        }
      },
      { concurrency: DOWNLOAD_CONFIG.concurrency },
    );

    const periodStats = enabledModels.reduce((acc, model) => {
      acc[model.id] = { ok: 0, skip: 0, fail: 0, total: (byModel[model.id] || []).length };
      return acc;
    }, {});

    for (const result of results) {
      periodStats[result.modelId][result.status] += 1;
      sourceStats[result.modelId].total[result.status] += 1;
    }

    for (const model of enabledModels) {
      sourceStats[model.id].byPeriod[String(period)] = {
        ok: periodStats[model.id].ok,
        skip: periodStats[model.id].skip,
        fail: periodStats[model.id].fail,
        total: periodStats[model.id].total,
      };
    }

    const periodUnit = timeType === 'month' ? '月' : '年';
    console.log(`[${periodLabel}] [📊]按模型按${periodUnit}统计:`);
    for (const model of enabledModels) {
      const stats = periodStats[model.id];
      console.log(
        `[${periodLabel}] ${model.id}: total=${stats.total}, ok=${stats.ok}, skip=${stats.skip}, fail=${stats.fail}`,
      );
    }
  }

  const periodUnit = timeType === 'month' ? '月' : '年';
  console.log(
    `\n数据源 ${id} 列表读取统计（按${periodUnit}）: ok=${listStats.total.ok}, fail=${listStats.total.fail}`,
  );
  const listPeriodKeys = Object.keys(listStats.byPeriod).sort();
  for (const period of listPeriodKeys) {
    const stats = listStats.byPeriod[period];
    if (stats.status === 'ok') {
      console.log(`[${id}] 列表 ${period}: ok, links=${stats.urlCount}`);
    } else {
      console.log(`[${id}] 列表 ${period}: fail, url=${stats.url}`);
      console.log(`[${id}] 列表 ${period} 失败原因: ${stats.error}`);
    }
  }

  console.log(`\n数据源 ${id} 下载统计汇总（按${periodUnit}）`);
  for (const model of enabledModels) {
    const modelStats = sourceStats[model.id];
    console.log(
      `[${id}] ${model.id} 总计: ok=${modelStats.total.ok}, skip=${modelStats.total.skip}, fail=${modelStats.total.fail}`,
    );

    const periodKeys = Object.keys(modelStats.byPeriod).sort();
    for (const period of periodKeys) {
      const stats = modelStats.byPeriod[period];
      console.log(
        `[${id}] ${model.id} ${period}: total=${stats.total}, ok=${stats.ok}, skip=${stats.skip}, fail=${stats.fail}`,
      );
    }
  }
}

async function main() {
  const enabledSources = DOWNLOAD_CONFIG.sources.filter((item) => item.enabled);
  console.log(`启用数据源数量: ${enabledSources.length}`);
  console.log(`下载并发数: ${DOWNLOAD_CONFIG.concurrency}`);
  console.log(`已存在XML合法性校验: ${DOWNLOAD_CONFIG.validateExistingXml.enabled}`);
  console.log(`代理设置: ${proxy}`);

  for (const sourceConfig of enabledSources) {
    // 串行处理数据源，便于控制下载日志与异常定位
    await runSource(sourceConfig);
  }

  console.log('\n全部数据源处理完成');
}

main().catch((err) => {
  console.error('主流程异常退出');
  console.error(err);
  process.exitCode = 1;
});
