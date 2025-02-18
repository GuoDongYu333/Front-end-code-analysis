/**
 * 检查类型引用节点
 * @param analysisContext 
 * @returns 
 */
export const typePlugin = (analysisContext) => {
  const mapName = "typeMap";
  analysisContext[mapName] = {};
  function isTypeCheck(
    context,
    tsCompiler,
    node,
    depth,
    apiName,
    matchImportItem,
    filePath,
    projectName,
    httpRepo,
    line
  ) {
    try {
      if (node.parent && tsCompiler.isTypeReferenceNode(node.parent)) {
        if (!context[mapName][apiName]) {
          context[mapName][apiName] = {};
          context[mapName][apiName].callNum = 1;
          context[mapName][apiName].callOrigin = matchImportItem.origin;
          context[mapName][apiName].callFiles = {};
          context[mapName][apiName].callFiles[filePath] = {};
          context[mapName][apiName].callFiles[filePath].projectName =
            projectName;
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
      }
      return false;
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
    mapName,
    checkFun: isTypeCheck,
    afterHook: null,
  };
};
