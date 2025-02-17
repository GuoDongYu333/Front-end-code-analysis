export const browserPlugin = (analysisContext) => {
  const mapName = "browserMap";
  analysisContext[mapName] = {};
  function isBrowserCheck(
    context,
    apiName,
    filePath,
    projectName,
    httpRepo,
    line
  ) {
    try {
      if (!context[mapName][apiName]) {
        context[mapName][apiName] = {};
        context[mapName][apiName].callNum = 1;
        context[mapName][apiName].callOrigin = null;
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
        return true;
      }
    } catch (error) {
      const info = {
        projectName,
        apiName,
        httpRepo: httpRepo + filePath.split("&")[1] + "#L" + line,
        line,
        stack: error.stack,
      };
      context.addDiagnosisInfo(info);
      return false;
    }
  }
  return {
    mapName,
    checkFun: isBrowserCheck,
    afterHook: null,
  };
};
