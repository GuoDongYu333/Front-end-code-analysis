import program from "commander";
import path from "path";
import fs from "fs";
import chalk from "chalk";

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
                //TODO 完成核心逻辑
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
        }
      } else {
        console.log(chalk.red("error：缺少analysis.config.js文件"));
      }
    } catch (error) {
      console.log(chalk.red(error.stack));
    }
  });
