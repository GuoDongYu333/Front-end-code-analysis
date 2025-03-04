import moment from "moment";
import ora from "ora";
import chalk from "chalk";
import { REPORTTITLE, TIMEFORMAT } from "./constant.js";
import { CodeAnalysis } from "./analysis.js";


export const codeAnalysis = (config) => {
  return new Promise((resolve, reject) => {
    let spinner = ora(chalk.green("analysis start")).start();
    try {
      // 新建分析实例
      const coderTask = new CodeAnalysis(config);
      // 执行代码分析
      coderTask.analysis();
      // 生成报告内容
      const mapNames = coderTask.pluginQueue
        .map((item) => item.mapName)
        .concat(coderTask.browserQueue.map((item) => item.mapName));
      const report = {
        importItemMap: coderTask.importItemMap,
        versionMap: coderTask.versionMap,
        parseErrorInfos: coderTask.parseErrorInfos,
        scoreMap: coderTask.scoreMap,
        reportTitle: config.reportTitle || REPORTTITLE,
        analysisTime: moment(Date.now()).format(TIMEFORMAT),
        mapNames: mapNames,
      };
      if (mapNames.length > 0) {
        mapNames.forEach((item) => {
          report[item] = coderTask[item];
        });
      }
      resolve({
        report: report,
        diagnosisInfos: coderTask.diagnosisInfos,
      });
      spinner.succeed(chalk.green("analysis success"));
    } catch (e) {
      reject(e);
      spinner.fail(chalk.red("analysis fail"));
    }
  });
};
