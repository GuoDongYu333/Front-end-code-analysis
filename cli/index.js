import { program } from "commander";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { rmDir, mkDir } from "../lib/file.js";
import { REPORTDEFAULTDIR, VUETEMPTSDIR } from "../lib/constant.js";
import { writeDiagnosisReport, writeReport } from "../lib/report.js";

program
  .command("analysis")
  .description("analysis code and init report")
  .action(async () => {
    try {
      const configPath = path.join(process.cwd(), "./analysis.config.js");
      const isConfigExist = fs.existsSync(configPath);
      if (isConfigExist) {
        let config = require(configPath);
        if (
          config.scanSource &&
          Array.isArray(config.scanSource) &&
          config.scanSource.length > 0
        ) {
          let isParamsError = false;
          let isCodePathError = false;
          let unExistDir = false;
          for (let i = 0; i < config.scanSource.length; i++) {
            if (
              !config.scanSource[i].name ||
              !config.scanSource[i].path ||
              !Array.isArray(config.scanSource[i].path) ||
              config.scanSource[i].path.length === 0
            ) {
              isParamsError = true;
              break;
            }
            let innerBreak = false;
            const tempPathArr = config.scanSource[i].path;
            for (let j = 0; j < tempPathArr.length; j++) {
              const tempPath = path.join(process.cwd(), tempPathArr[j]);
              if (!fs.existsSync(tempPath)) {
                isCodePathError = true;
                unExistDir = true;
                innerBreak = true;
                break;
              }
            }
            if (innerBreak) break;
          }
          if (!isParamsError) {
            if (!isCodePathError) {
              if (config && config.analysisTarget) {
                try {
                  rmDir(config.reportDir || REPORTDEFAULTDIR);
                  rmDir(VUETEMPTSDIR);
                  if (config.isScanVue) {
                    mkDir(VUETEMPTSDIR);
                  }
                  //TODO codeAnalysis 分析代码核心部分
                  const { report, diagnosisInfos } = await codeAnalysis(config);
                  writeReport(config.reportDir || "report", report);
                  writeDiagnosisReport(
                    config.reportDir || "report",
                    diagnosisInfos
                  );
                  rmDir(VUETEMPTSDIR);
                  if (
                    config.scorePlugin &&
                    config.alarmThreshold &&
                    typeof config.alarmThreshold === "number" &&
                    config.alarmThreshold > 0
                  ) {
                    if (
                      report.scoreMap.score &&
                      report.scoreMap.score < config.alarmThreshold
                    ) {
                      console.log(
                        chalk.red(
                          "\n" +
                            "代码得分：" +
                            report.scoreMap.score +
                            ", 不合格"
                        )
                      );
                    }
                    if (report.scoreMap.message.length > 0) {
                      // 输出代码建议信息
                      console.log(chalk.yellow("\n" + "优化建议："));
                      report.scoreMap.message.forEach((element, index) => {
                        console.log(chalk.yellow(index + 1 + ". " + element));
                      });
                    } else {
                      console.log(
                        chalk.green("\n" + "代码得分：" + report.scoreMap.score)
                      ); // 输出代码分数信息
                      if (report.scoreMap.message.length > 0) {
                        // 输出代码建议信息
                        console.log(chalk.yellow("\n" + "优化建议："));
                        report.scoreMap.message.forEach((element, index) => {
                          console.log(chalk.yellow(index + 1 + ". " + element));
                        });
                      }
                    }
                  } else if (config.scorePlugin) {
                    console.log(
                      chalk.green("\n" + "代码得分：" + report.scoreMap.score)
                    );
                    if (report.scoreMap.message.length > 0) {
                      // 输出代码建议信息
                      console.log(chalk.yellow("\n" + "优化建议："));
                      report.scoreMap.message.forEach((element, index) => {
                        console.log(chalk.yellow(index + 1 + ". " + element));
                      });
                    }
                  }
                } catch (error) {
                  rmDir(VUETEMPTSDIR);
                  console.log(chalk.red(error.stack)); // 输出错误信息
                  process.exit(1); // 错误退出进程
                }
              } else {
                console.log(
                  chalk.red("error: 配置文件中缺少必填配置项analysisTarget")
                );
              }
            } else {
              console.log(
                chalk.red(`error: 配置文件中待分析文件目录${unExistDir}不存在`)
              );
            }
          } else {
            console.log(chalk.red("error：scanSource参数选项必填属性不能为空"));
          }
        } else {
          console.log(
            chalk.red("error: 配置文件中必填配置项scanSource不能为空")
          );
        }
      } else {
        console.log(chalk.red("error：缺少analysis.config.js文件"));
      }
    } catch (error) {
      console.log(chalk.red(error.stack));
    }
  });

program.parse(process.argv);
