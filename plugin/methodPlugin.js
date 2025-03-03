/**
 * 判断节点是否是函数调用（不是函数声明），通过判断父节点的位置和当前节点是否一致来实现
 * 判断是否是入参，通过判断是否在arguments中实现，也就是通过判断baseNode的pos/end是否和baseNode的parent的expression的pos/end一致来判断
 * @param  analysisContext
 * @returns mapName,checkFun，afterHook
 */
export const methodPlugin = (analysisContext) => {
  const mapName = "methodMap";
  analysisContext[mapName] = {};
  function isMethodCheck(
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
      if (node.parent && tsCompiler.isCallExpression(node.parent)) {
        if (
          node.parent.expression.pos === node.pos &&
          node.parent.expression.end === node.end
        ) {
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
              !Object.keys(context[mapName][apiName].callFiles).includes(
                filePath
              )
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
      }
      return false;
    } catch (error) {
      const info = {
        projectName: projectName,
        matchImportItem: matchImportItem,
        apiName: apiName,
        httpRepo: httpRepo + filePath.split("&")[1] + "#L" + line,
        file: filePath.split("&")[1],
        line: line,
        stack: error.stack,
      };
      context.addDiagnosisInfo(info);
      return false;
    }
  }
  return {
    mapName,
    checkFun: isMethodCheck,
    afterHook: null,
  };
};
