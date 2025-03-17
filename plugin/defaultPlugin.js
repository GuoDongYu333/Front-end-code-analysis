import chalk from "chalk";

/**
 * 记录调用信息
 * @param analysisContext
 * @returns
 */
export const defaultPlugin = (analysisContext) => {
  const mapName = "apiMap";
  analysisContext[mapName] = {};
  function isApiCheck(
    context,
    apiName,
    matchImportItem,
    filePath,
    projectName,
    httpRepo,
    line
  ) {
    try {
      if (!context[mapName][apiName]) {
        context[mapName][apiName] = {};
        context[mapName][apiName].callNum = 1;
        context[mapName][apiName].callOrigin = matchImportItem.origin;
        context[mapName][apiName].callFiles = {};
        context[mapName][apiName].callFiles[filePath] = {};
        context[mapName][apiName].callFiles[filePath].projectName = projectName;
        context[mapName][apiName].callFiles[filePath].httpRepo = httpRepo;
        context[mapName][apiName].callFiles[filePath].lines = [];
        context[mapName][apiName].callFiles[filePath].lines.push(line);
      } else {
        context[mapName][apiName].callNum++;
        if (
          !Object.keys(context[mapName][apiName].callFiles).includes(filePath)
        ) {
          context[mapName][apiName].callFiles[filePath] = {};
          context[mapName][apiName].callFiles[filePath].projectName =
            projectName;
          context[mapName][apiName].callFiles[filePath].httpRepo = httpRepo;
          context[mapName][apiName].callFiles[filePath].lines = [];
          context[mapName][apiName].callFiles[filePath].lines.push(line);
        } else {
          context[mapName][apiName].callFiles[filePath].lines.push(line);
        }
      }
      return true;
    } catch (e) {
      const info = {
        projectName: projectName,
        matchImportItem: matchImportItem,
        apiName: apiName,
        httpRepo: httpRepo + filePath.split("&")[1] + "#L" + line,
        file: filePath.split("&")[1],
        line: line,
        stack: e.stack,
      };
      context.addDiagnosisInfo(info);
      return false;
    }
  }
  return {
    mapName: mapName,
    checkFun: isApiCheck,
    afterHook: null,
  };
};
