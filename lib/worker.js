// import { parentPort, workerData } from "worker_threads";
// import { parseTs, parseVue } from "./parse.js";
// import tsCompiler from "typescript";

// // 从主线程接收的数据
// const { files, type, options } = workerData;
// // console.log(files, "这是worker");

// // 用于存储分析结果
// const importItemMap = {};
// const diagnosisInfos = [];
// const parseErrorInfos = [];

// function _checkPropertyAccess(node, index = 0, apiName = "") {
//   if (index > 0) {
//     apiName = apiName + "." + node.name.escapedText;
//   } else {
//     apiName = apiName + node.escapedText;
//   }
//   if (tsCompiler.isPropertyAccessExpression(node.parent)) {
//     index++;
//     return this._checkPropertyAccess(node.parent, index, apiName);
//   } else {
//     return {
//       baseNode: node,
//       depth: index,
//       apiName: apiName,
//     };
//   }
// }

// function _runBrowserPlugins(
//   tsCompiler,
//   baseNode,
//   depth,
//   apiName,
//   filePath,
//   projectName,
//   httpRepo,
//   line
// ) {
//   if (global.browserQueue && global.browserQueue.length > 0) {
//     for (let i = 0; i < global.browserQueue.length; i++) {
//       const checkFun = global.browserQueue[i].checkFun;
//       if (
//         checkFun(
//           global.thisthis,
//           tsCompiler,
//           baseNode,
//           depth,
//           apiName,
//           filePath,
//           projectName,
//           httpRepo,
//           line
//         )
//       ) {
//         break;
//       }
//     }
//   }
// }

// function _findImportItems(ast, filePath, baseLine = 0) {
//   let importItems = {};
//   function dealImports(temp) {
//     importItems[temp.name] = {
//       origin: temp.origin,
//       //存储symbol的pos/end是用来判断是否是当前模块的导入信息
//       symbolPos: temp.symbolPos,
//       symbolEnd: temp.symbolEnd,
//       //存储标识符的pos/end用来排除import语句的干扰
//       indentifierPos: temp.indentifierPos,
//       indentifierEnd: temp.indentifierEnd,
//     };
//     if (!importItemMap[temp.name]) {
//       importItemMap[temp.name] = {
//         callOrigin: temp.origin,
//         callFiles: [filePath],
//       };
//     } else {
//       importItemMap[temp.name].callFiles.push(filePath);
//     }
//   }
//   function walk(node) {
//     //使用tsCompiler来进行ast的深度优先遍历
//     tsCompiler.forEachChild(node, walk);
//     //通过getLineAndCharacterOfPosition将pos/end转换为当前代码的位置，加上基于vue文件的偏移量(baseLine)，算出代码正确位置
//     const line =
//       ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;
//     //判断当前节点是否是导入节点
//     if (tsCompiler.isImportDeclaration(node)) {
//       if (
//         //存在导入信息
//         node.moduleSpecifier &&
//         //存在导入的模块名
//         node.moduleSpecifier.text &&
//         //模块名是当前分析的模块名
//         node.moduleSpecifier.text == global.thisthis._analysisTarget
//       ) {
//         //存在导入项 import xxx from 'ABC' 判断是否存在xxx
//         if (node.importClause) {
//           //判断是否为默认导入，如不是则name为undefined
//           if (node.importClause.name) {
//             let temp = {
//               name: node.importClause.name.escapedText,
//               origin: null,
//               symbolPos: node.importClause.pos,
//               symbolEnd: node.importClause.end,
//               indentifierPos: node.importClause.name.pos,
//               indentifierEnd: node.importClause.name.end,
//               line,
//             };
//             dealImports(temp);
//           }
//         }
//         //除了默认导入之外，其他的导入全部都有nameBindings属性
//         if (node.importClause.namedBindings) {
//           //如果是namedSpaceImport则是默认全局导入 import * as xxx from 'ABC'
//           if (
//             tsCompiler.isNamespaceImport(node.importClause.namedBindings) &&
//             node.importClause.namedBindings.name
//           ) {
//             let temp = {
//               name: node.importClause.namedBindings.name.escapedText,
//               origin: "*",
//               symbolPos: node.importClause.namedBindings.pos,
//               symbolEnd: node.importClause.namedBindings.end,
//               indentifierPos: node.importClause.namedBindings.name.pos,
//               indentifierEnd: node.importClause.namedBindings.name.end,
//               line,
//             };
//             dealImports(temp);
//           }
//           //如果是namedImports的导入，则是使用{}的导入，如 import { xxx, yyy as zzz } from 'ABC'或import { xxx as yyy } from 'ABC'
//           if (tsCompiler.isNamedImports(node.importClause.namedBindings)) {
//             if (
//               node.importClause.namedBindings.elements &&
//               node.importClause.namedBindings.elements.length > 0
//             ) {
//               const tempArr = node.importClause.namedBindings.elements;
//               tempArr.forEach((element) => {
//                 if (tsCompiler.isImportSpecifier(element)) {
//                   let temp = {
//                     name: element.name.escapedText,
//                     //判断是否具有propertyName来确定是否是别名导入
//                     origin: element.propertyName
//                       ? element.propertyName.escapedText
//                       : null,
//                     symbolPos: element.pos,
//                     symbolEnd: element.end,
//                     indentifierPos: element.name.pos,
//                     indentifierEnd: element.name.end,
//                     line,
//                   };
//                   dealImports(temp);
//                 }
//               });
//             }
//           }
//         }
//       }
//     }
//   }
//   walk(ast);
//   return importItems;
// }

// function _dealAST(
//   importItems,
//   ast,
//   checker,
//   filePath,
//   projectName,
//   httpRepo,
//   baseLine = 0
// ) {
//   const importItemNames = Object.keys(importItems);
//   function walk(node) {
//     tsCompiler.forEachChild(node, walk);
//     const line =
//       ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;
//     if (
//       //判断节点是否为标识符（函数名或变量等）
//       tsCompiler.isIdentifier(node) &&
//       //判断是否有有效名称
//       node.escapedText &&
//       //判断当前是否有需要处理的导入项
//       importItemNames.length > 0 &&
//       //判断当前的标识符是否在导入项中
//       importItemNames.includes(node.escapedText)
//     ) {
//       const matchImportItem = importItems[node.escapedText];
//       //排除导入语句自身的影响
//       if (
//         node.pos !== matchImportItem.indentifierPos &&
//         node.end !== matchImportItem.indentifierEnd
//       ) {
//         const symbol = checker.getSymbolAtLocation(node);
//         if (
//           //是否有有效symbol
//           symbol &&
//           //是否有声明信息
//           symbol.declarations &&
//           //是否包含具体说明
//           symbol.declarations.length > 0
//         ) {
//           const nodeSymbol = symbol.declarations[0];
//           //上下文声明是否与importItems中的item有关
//           if (
//             matchImportItem.symbolPos === nodeSymbol.pos &&
//             matchImportItem.symbolEnd === nodeSymbol.end
//           ) {
//             if (node.parent) {
//               const { baseNode, depth, apiName } = _checkPropertyAccess(node);
//               _runAnalysisPlugins(
//                 tsCompiler,
//                 baseNode,
//                 depth,
//                 apiName,
//                 matchImportItem,
//                 filePath,
//                 projectName,
//                 httpRepo,
//                 line
//               );
//             } else {
//               //Identifier节点如果没有parent属性，说明AST语义异常，不用分析
//             }
//           } else {
//             //只是同名，但与importItems中的item无关
//           }
//         }
//       }
//     }
//     if (
//       tsCompiler.isIdentifier(node) &&
//       node.escapedText &&
//       options._browserApis.length > 0 &&
//       options._browserApis.includes(node.escapedText)
//     ) {
//       const symbol = checker.getSymbolAtLocation(node);
//       if (symbol && symbol.declarations) {
//         if (
//           symbol.declarations.length > 1 ||
//           (symbol.declarations.length === 1 &&
//             symbol.declarations[0].pos > ast.end)
//         ) {
//           // 在AST中找不到上下文声明，证明是Bom,Dom对象
//           const { baseNode, depth, apiName } = _checkPropertyAccess(node);
//           if (
//             !(
//               depth > 0 &&
//               node.parent.name &&
//               node.parent.name.pos == node.pos &&
//               node.parent.name.end == node.end
//             )
//           ) {
//             // 排除作为属性的场景
//             _runBrowserPlugins(
//               tsCompiler,
//               baseNode,
//               depth,
//               apiName,
//               filePath,
//               projectName,
//               httpRepo,
//               line
//             );
//           }
//         }
//       }
//     }
//   }
//   walk(ast);
//   _runAnalysisPluginsHook(
//     importItems,
//     ast,
//     checker,
//     filePath,
//     projectName,
//     httpRepo,
//     baseLine
//   );
// }

// // 遍历分配的文件块
// files.forEach(({ file, showPath, projectName, httpRepo }) => {
//   try {
//     let ast, checker, baseLine;
//     if (type === "vue") {
//       // 解析 Vue 文件，提取 AST 和 Checker
//       ({ ast, checker, baseLine } = parseVue(file));
//     } else if (type === "ts") {
//       // 解析 TypeScript 文件，提取 AST 和 Checker
//       ({ ast, checker } = parseTs(file));
//     }
//     console.log(baseLine);

//     // 提取导入信息
//     const importItems = _findImportItems(ast, showPath, baseLine || 0);

//     // 如果有导入信息或浏览器 API，则处理 AST
//     if (
//       Object.keys(importItems).length > 0 ||
//       options._browserApis.length > 0
//     ) {
//       _dealAST(
//         importItems,
//         ast,
//         checker,
//         showPath,
//         projectName,
//         httpRepo,
//         baseLine || 0
//       );
//     }
//   } catch (error) {
//     // 捕获错误并记录诊断信息
//     const info = {
//       projectName,
//       httpRepo: httpRepo + showPath,
//       file: showPath,
//       stack: error.stack,
//     };
//     parseErrorInfos.push(info);
//     diagnosisInfos.push(info);
//   }
// });

// // 将结果发送回主线程
// parentPort.postMessage({ importItemMap, diagnosisInfos, parseErrorInfos });
