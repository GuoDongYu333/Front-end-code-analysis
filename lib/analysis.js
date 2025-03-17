import tsCompiler from "typescript";
import { getJSONContent, scanTSFiles, scanVueFiles } from "./file.js";
import { parseTs, parseVue } from "./parse.js";
import {
  defaultPlugin,
  methodPlugin,
  typePlugin,
  browserPlugin,
} from "../plugin/index.js";
import { CODEFILETYPE } from "../lib/constant.js";
import processLog from "single-line-log";
import chalk from "chalk";
import { scorePlugin } from "../plugin/scorePlugin.js";
// import path from "path";
// import { Worker } from "worker_threads";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export class CodeAnalysis {
  constructor(options) {
    this._scanSource = options.scanSource;
    this._analysisTarget = options.analysisTarget;
    this._blackList = options.blackList || [];
    this._browserApis = options.browserApis || [];
    this._isScanVue = options.isScanVue || false;
    this._scorePlugin = options.scorePlugin || null;
    this._analysisPlugins = options.analysisPlugins || [];
    this.pluginQueue = [];
    this.browserQueue = [];
    this.importItemMap = {};
    this.versionMap = {};
    this.parseErrorInfos = [];
    this.diagnosisInfos = [];
    this.scoreMap = {};
    this.workerResults = [];
    // global.thisthis = this;
  }

  /**
   * 安装插件
   * @param {*} plugin 插件队列
   */
  _installPlugin(plugin) {
    if (plugin.length > 0) {
      plugin.forEach((item) => {
        this.pluginQueue.push(item(this));
      });
    }
    this.pluginQueue.push(methodPlugin(this));
    this.pluginQueue.push(typePlugin(this));
    this.pluginQueue.push(defaultPlugin(this));
    if (this._browserApis.length > 0) {
      global.browserQueue = [];
      this.browserQueue.push(browserPlugin(this));
      global.browserQueue.push(browserPlugin(this));
    }
  }

  /**
   * 检查是否存在链式调用,找出链路顶点的节点
   * 例如app.a.b.c，按照ast结构，因为是深度优先遍历，先遍历到的是c，其次是b,a,app，当遍历到app时，则触发条件，调用此函数
   * @param {*} node
   * @param {*} index
   * @param {*} apiName
   */

  _checkPropertyAccess(node, index = 0, apiName = "") {
    if (index > 0) {
      apiName = apiName + "." + node.name.escapedText;
    } else {
      apiName = apiName + node.escapedText;
    }
    if (tsCompiler.isPropertyAccessExpression(node.parent)) {
      index++;
      return this._checkPropertyAccess(node.parent, index, apiName);
    } else {
      return {
        baseNode: node,
        depth: index,
        apiName: apiName,
      };
    }
  }

  /**
   * 运行最开始install的插件的函数
   * @param {*} tsCompiler tsCompiler
   * @param {*} baseNode
   * @param {*} depth 当前处于的深度
   * @param {*} apiName 调用名称
   * @param {*} matchImportItem 命中的import导入项
   * @param {*} filePath 文件路径
   * @param {*} projectName 项目名称
   * @param {*} httpRepo 仓库地址
   * @param {*} line 行
   */
  _runAnalysisPlugins(
    tsCompiler,
    baseNode,
    depth,
    apiName,
    matchImportItem,
    filePath,
    projectName,
    httpRepo,
    line
  ) {
    if (this.pluginQueue.length > 0) {
      for (let i = 0; i < this.pluginQueue.length; i++) {
        const checkFun = this.pluginQueue[i].checkFun;
        if (
          checkFun(
            this,
            tsCompiler,
            baseNode,
            depth,
            apiName,
            matchImportItem,
            filePath,
            projectName,
            httpRepo,
            line
          )
        ) {
          break;
        }
      }
    }
  }

  _runAnalysisPluginsHook(
    importItems,
    ast,
    checker,
    filePath,
    projectName,
    httpRepo,
    baseLine
  ) {
    if (this.pluginQueue.length > 0) {
      for (let i = 0; i < this.pluginQueue.length; i++) {
        const afterHook = this.pluginQueue[i].afterHook;
        if (afterHook && typeof afterHook === "function") {
          afterHook(
            this,
            this.pluginQueue[i].mapName,
            importItems,
            ast,
            checker,
            filePath,
            projectName,
            httpRepo,
            baseLine
          );
        }
      }
    }
  }

  _runBrowserPlugins(
    tsCompiler,
    baseNode,
    depth,
    apiName,
    filePath,
    projectName,
    httpRepo,
    line
  ) {
    if (this.browserQueue.length > 0) {
      for (let i = 0; i < this.browserQueue.length; i++) {
        const checkFun = this.browserQueue[i].checkFun;
        if (
          checkFun(
            this,
            tsCompiler,
            baseNode,
            depth,
            apiName,
            filePath,
            projectName,
            httpRepo,
            line
          )
        ) {
          break;
        }
      }
    }
  }

  /**
   * 根据不同情况判断导入信息并保存至object中（保存至importItemsMap中）
   * @param {*} ast
   * @param {*} filePath
   * @param {*} baseLine
   * @returns 返回当前文件导入的模块信息
   */
  _findImportItems(ast, filePath, baseLine = 0) {
    let importItems = {};
    let that = this;
    function dealImports(temp) {
      importItems[temp.name] = {
        origin: temp.origin,
        //存储symbol的pos/end是用来判断是否是当前模块的导入信息
        symbolPos: temp.symbolPos,
        symbolEnd: temp.symbolEnd,
        //存储标识符的pos/end用来排除import语句的干扰
        indentifierPos: temp.indentifierPos,
        indentifierEnd: temp.indentifierEnd,
      };
      if (!that.importItemMap[temp.name]) {
        that.importItemMap[temp.name] = {
          callOrigin: temp.origin,
          callFiles: [filePath],
        };
      } else {
        that.importItemMap[temp.name].callFiles.push(filePath);
      }
    }
    function walk(node) {
      //使用tsCompiler来进行ast的深度优先遍历
      tsCompiler.forEachChild(node, walk);
      //通过getLineAndCharacterOfPosition将pos/end转换为当前代码的位置，加上基于vue文件的偏移量(baseLine)，算出代码正确位置
      const line =
        ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;
      //判断当前节点是否是导入节点
      if (tsCompiler.isImportDeclaration(node)) {
        if (
          //存在导入信息
          node.moduleSpecifier &&
          //存在导入的模块名
          node.moduleSpecifier.text &&
          //模块名是当前分析的模块名
          node.moduleSpecifier.text == that._analysisTarget
        ) {
          //存在导入项 import xxx from 'ABC' 判断是否存在xxx
          if (node.importClause) {
            //判断是否为默认导入，如不是则name为undefined
            if (node.importClause.name) {
              let temp = {
                name: node.importClause.name.escapedText,
                origin: null,
                symbolPos: node.importClause.pos,
                symbolEnd: node.importClause.end,
                indentifierPos: node.importClause.name.pos,
                indentifierEnd: node.importClause.name.end,
                line,
              };
              dealImports(temp);
            }
          }
          //除了默认导入之外，其他的导入全部都有nameBindings属性
          if (node.importClause.namedBindings) {
            //如果是namedSpaceImport则是默认全局导入 import * as xxx from 'ABC'
            if (
              tsCompiler.isNamespaceImport(node.importClause.namedBindings) &&
              node.importClause.namedBindings.name
            ) {
              let temp = {
                name: node.importClause.namedBindings.name.escapedText,
                origin: "*",
                symbolPos: node.importClause.namedBindings.pos,
                symbolEnd: node.importClause.namedBindings.end,
                indentifierPos: node.importClause.namedBindings.name.pos,
                indentifierEnd: node.importClause.namedBindings.name.end,
                line,
              };
              dealImports(temp);
            }
            //如果是namedImports的导入，则是使用{}的导入，如 import { xxx, yyy as zzz } from 'ABC'或import { xxx as yyy } from 'ABC'
            if (tsCompiler.isNamedImports(node.importClause.namedBindings)) {
              if (
                node.importClause.namedBindings.elements &&
                node.importClause.namedBindings.elements.length > 0
              ) {
                const tempArr = node.importClause.namedBindings.elements;
                tempArr.forEach((element) => {
                  if (tsCompiler.isImportSpecifier(element)) {
                    let temp = {
                      name: element.name.escapedText,
                      //判断是否具有propertyName来确定是否是别名导入
                      origin: element.propertyName
                        ? element.propertyName.escapedText
                        : null,
                      symbolPos: element.pos,
                      symbolEnd: element.end,
                      indentifierPos: element.name.pos,
                      indentifierEnd: element.name.end,
                      line,
                    };
                    dealImports(temp);
                  }
                });
              }
            }
          }
        }
      }
    }
    walk(ast);
    return importItems;
  }

  _dealAST(
    importItems,
    ast,
    checker,
    filePath,
    projectName,
    httpRepo,
    baseLine = 0
  ) {
    const that = this;
    const importItemNames = Object.keys(importItems);
    function walk(node) {
      tsCompiler.forEachChild(node, walk);
      const line =
        ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;
      if (
        //判断节点是否为标识符（函数名或变量等）
        tsCompiler.isIdentifier(node) &&
        //判断是否有有效名称
        node.escapedText &&
        //判断当前是否有需要处理的导入项
        importItemNames.length > 0 &&
        //判断当前的标识符是否在导入项中
        importItemNames.includes(node.escapedText)
      ) {
        const matchImportItem = importItems[node.escapedText];
        //排除导入语句自身的影响
        if (
          node.pos !== matchImportItem.indentifierPos &&
          node.end !== matchImportItem.indentifierEnd
        ) {
          const symbol = checker.getSymbolAtLocation(node);
          if (
            //是否有有效symbol
            symbol &&
            //是否有声明信息
            symbol.declarations &&
            //是否包含具体说明
            symbol.declarations.length > 0
          ) {
            const nodeSymbol = symbol.declarations[0];
            //上下文声明是否与importItems中的item有关
            if (
              matchImportItem.symbolPos === nodeSymbol.pos &&
              matchImportItem.symbolEnd === nodeSymbol.end
            ) {
              if (node.parent) {
                const { baseNode, depth, apiName } =
                  that._checkPropertyAccess(node);
                that._runAnalysisPlugins(
                  tsCompiler,
                  baseNode,
                  depth,
                  apiName,
                  matchImportItem,
                  filePath,
                  projectName,
                  httpRepo,
                  line
                );
              } else {
                //Identifier节点如果没有parent属性，说明AST语义异常，不用分析
              }
            } else {
              //只是同名，但与importItems中的item无关
            }
          }
        }
      }
      if (
        tsCompiler.isIdentifier(node) &&
        node.escapedText &&
        that._browserApis.length > 0 &&
        that._browserApis.includes(node.escapedText)
      ) {
        const symbol = checker.getSymbolAtLocation(node);
        if (symbol && symbol.declarations) {
          if (
            symbol.declarations.length > 1 ||
            (symbol.declarations.length === 1 &&
              symbol.declarations[0].pos > ast.end)
          ) {
            // 在AST中找不到上下文声明，证明是Bom,Dom对象
            const { baseNode, depth, apiName } =
              that._checkPropertyAccess(node);
            if (
              !(
                depth > 0 &&
                node.parent.name &&
                node.parent.name.pos == node.pos &&
                node.parent.name.end == node.end
              )
            ) {
              // 排除作为属性的场景
              that._runBrowserPlugins(
                tsCompiler,
                baseNode,
                depth,
                apiName,
                filePath,
                projectName,
                httpRepo,
                line
              );
            }
          }
        }
      }
    }
    walk(ast);
    that._runAnalysisPluginsHook(
      importItems,
      ast,
      checker,
      filePath,
      projectName,
      httpRepo,
      baseLine
    );
  }

  /**
   * 扫描文件
   * @param {*} scanSource 扫描位置
   * @param {*} type 文件类型
   * @returns 当前扫描位置下符合文件类型的所有文件,按parse和show两种格式存储在Object中
   */
  _scanFiles(scanSource, type) {
    let entrys = [];
    scanSource.forEach((item) => {
      const entryObj = {
        name: item.name,
        httpRepo: item.httpRepo,
      };
      let parse = [];
      let show = [];
      const scanPath = item.path;
      scanPath.forEach((sitem) => {
        let tempEntry = [];
        if (type === CODEFILETYPE.VUE) {
          tempEntry = scanVueFiles(sitem);
        }
        if (type === CODEFILETYPE.TS) {
          tempEntry = scanTSFiles(sitem);
        }
        let tempPath = tempEntry.map((titem) => {
          if (item.format && typeof item.format === "function") {
            return item.format(titem.substring(titem.indexOf(sitem)));
          } else {
            return titem.substring(titem.indexOf(sitem));
          }
        });
        parse = parse.concat(tempEntry);
        show = show.concat(tempPath);
      });
      entryObj.parse = parse;
      entryObj.show = show;
      entrys.push(entryObj);
    });
    return entrys;
  }

  _targetVersionCollect(scanSource, analysisTarget) {
    scanSource.forEach((item) => {
      if (item.packageFile && item.packageFile !== "") {
        try {
          const lockInfo = getJSONContent(item.packageFile);
          const temp = Object.keys(lockInfo.dependencies);
          if (temp.length > 0) {
            temp.forEach((element) => {
              if (element === analysisTarget) {
                const version = lockInfo.dependencies[element].version;
                if (!this.versionMap[version]) {
                  this.versionMap[version] = {};
                  this.versionMap[version].callNum = 1;
                  this.versionMap[version].callSource = [];
                  this.versionMap[version].callSource.push(item.name);
                } else {
                  this.versionMap[version].callNum++;
                  this.versionMap[version].callSource.push(item.name);
                }
              }
            });
          }
        } catch (error) {}
      }
    });
  }

  /**
   * 记录诊断日志（添加至diagnosisInfos中）
   * @param {*} info
   */
  addDiagnosisInfo(info) {
    this.diagnosisInfos.push(info);
  }

  _scanCode(scanSource, type) {
    // 获取当前需要进行处理的文件路径数组(可能有多个文件路径)
    /**
     * 例如
     * 【
     *    {
            name: 'Code-Demo',
            httpRepo: 'https://github.com/liangxin199045/code-demo/blob/',
            parse: [
              'xxx',
              'xxx'
            ],
            show: [
              'xxx',
              'xxx'
            ]
          }，
          {
            name: 'Code-Demo2',
            httpRepo: 'https://github.com/liangxin199045/code-demo/blob/222',
            parse: [
              'xxx',
              'xxx'
            ],
            show: [
              'xxx',
              'xxx'
            ]
          }
     * 】
     */
    let entrys = this._scanFiles(scanSource, type);

    entrys.forEach((item) => {
      //获取到当前所有文件的路径对象
      /**
       * 例如
       * {
            name: 'Code-Demo',
            httpRepo: 'https://github.com/liangxin199045/code-demo/blob/',
            parse: [
              'xxx',
              'xxx'
            ],
            show: [
              'xxx',
              'xxx'
            ]
          }
       */
      const parseFiles = item.parse;
      if (parseFiles.length > 0) {
        //获取到parse数组中的每一个路径
        parseFiles.forEach((element, eIndex) => {
          //获取Code-Demo&src\message.ts这样的路径
          const showPath = item.name + "&" + item.show[eIndex];
          try {
            if (type === CODEFILETYPE.VUE) {
              //根据当前路径，获取到vue中的ts部分，并放到单独的ts文件中，返回ts的ast，checker以及ts在vue中的位置
              const { ast, checker, baseLine } = parseVue(element);
              //获取当前vue生成的ts文件中的导入信息，并将满足analysisTarget的保存进constructor的importItemMap中
              const importItems = this._findImportItems(
                ast,
                showPath,
                baseLine
              );
              if (
                Object.keys(importItems).length > 0 ||
                this._browserApis.length > 0
              ) {
                this._dealAST(
                  importItems,
                  ast,
                  checker,
                  showPath,
                  item.name,
                  item.httpRepo,
                  baseLine
                );
              }
            } else if (type === CODEFILETYPE.TS) {
              const { ast, checker } = parseTs(element);
              const importItems = this._findImportItems(ast, showPath);
              if (
                Object.keys(importItems).length > 0 ||
                this._browserApis.length > 0
              ) {
                this._dealAST(
                  importItems,
                  ast,
                  checker,
                  showPath,
                  item.name,
                  item.httpRepo
                );
              }
            }
          } catch (error) {
            const info = {
              projectName: item.name,
              httpRepo: item.httpRepo + item.show[eIndex],
              file: item.show[eIndex],
              stack: error.stack,
            };
            this.parseErrorInfos.push(info);
            this.addDiagnosisInfo(info);
          }
          processLog.stdout(
            chalk.green(
              `\n${item.name} ${type}分析进度: ${eIndex + 1}/${
                parseFiles.length
              }`
            )
          );
        });
      }
    });
  }

  _blackTag(queue) {
    if (queue.length > 0) {
      queue.forEach((item) => {
        Object.keys(this[item.mapName]).forEach((apiName) => {
          if (this._blackList.length > 0 && this._blackList.includes(apiName)) {
            this[item.mapName][apiName].isBlack = true;
          }
        });
      });
    }
  }
  /**
   * 入口函数,首先安装插件，然后对需要扫描的文件类型进行扫描（vue，ts/tsx，js/jsx）
   */

  // _mergeWorkerResults() {
  //   this.workerResults.forEach((result) => {
  //     // 合并 importItemMap
  //     Object.keys(result.importItemMap).forEach((key) => {
  //       if (!this.importItemMap[key]) {
  //         this.importItemMap[key] = result.importItemMap[key];
  //       } else {
  //         this.importItemMap[key].callFiles.push(
  //           ...result.importItemMap[key].callFiles
  //         );
  //       }
  //     });
  //     console.log(this.importItemMap, chalk.bgYellowBright("这是想看的"));

  //     // 合并 diagnosisInfos
  //     this.diagnosisInfos.push(...result.diagnosisInfos);

  //     // 合并其他结果（如 parseErrorInfos 等）
  //     this.parseErrorInfos.push(...result.parseErrorInfos);
  //   });
  // }

  // _analysisWithWorker(files, type) {
  //   const workerFile = path.resolve(__dirname, "./worker.js");
  //   const workerCount = Math.min(files.length, 4);
  //   const chunkSize = Math.ceil(files.length / workerCount);
  //   console.log(chalk.bgYellow(chunkSize, "这是想看的"));

  //   const fileChunks = [];

  //   for (let i = 0; i < files.length; i += chunkSize) {
  //     fileChunks.push(files.slice(i, i + chunkSize));
  //   }

  //   return new Promise((resolve, reject) => {
  //     let completedCount = 0;
  //     fileChunks.forEach((chunk, index) => {
  //       const worker = new Worker(workerFile, {
  //         workerData: {
  //           files: chunk,
  //           type,
  //           options: {
  //             _browserApis: this._browserApis,
  //           },
  //         },
  //       });
  //       worker.on("message", (result) => {
  //         this.workerResults.push(result);
  //         completedCount++;
  //         if (completedCount === fileChunks.length) {
  //           resolve(this._mergeWorkerResults());
  //         }
  //       });

  //       worker.on("error", (error) => {
  //         reject(error);
  //       });

  //       worker.on("exit", (code) => {
  //         if (code !== 0) {
  //           console.error(`Worker ${index} stopped with exit code ${code}`);
  //         }
  //       });
  //     });
  //   });
  // }

  // async _scanCodeWithWorker(scanSource, type) {
  //   const entry = this._scanFiles(scanSource, type);
  //   const files = entry.flatMap((item) => {
  //     return item.parse.map((file, index) => {
  //       return {
  //         file,
  //         showPath: item.name + "&" + item.show[index],
  //         projectName: item.name,
  //         httpRepo: item.httpRepo,
  //       };
  //     });
  //   });
  //   await this._analysisWithWorker(files, type);
  // }
  analysis() {
    this._installPlugin(this._analysisPlugins);
    if (this._isScanVue) {
      // this._scanCodeWithWorker(this._scanSource, CODEFILETYPE.VUE);
      this._scanCode(this._scanSource, CODEFILETYPE.VUE);
    }
    this._scanCode(this._scanSource, CODEFILETYPE.TS);
    // this._scanCodeWithWorker(this._scanSource, CODEFILETYPE.TS);
    this._blackTag(this.pluginQueue);
    this._blackTag(this.browserQueue);
    this._targetVersionCollect(this._scanSource, this._analysisTarget);

    if (this._scorePlugin) {
      if (typeof this._scorePlugin === "function") {
        this.scoreMap = this._scorePlugin(this);
      }
      if (this._scorePlugin === "default") {
        this.scoreMap = scorePlugin(this);
      }
    } else {
      this.scoreMap = null;
    }
  }
}

// 运行步骤
// 首先从cli的index进入，进行各种情况的判断，如果没有异常情况，则进入lib的index进行进一步处理，之后调用lib/analysis中的analysis函数进行代码检查，在analysis中运行流程如下：
//     - 运行_installPlugins安装插件
//     - 判断是否要检查Vue（首先调用_scanFilesVue来对文件入口进行分析，获取所有要检查vue的相对地址和绝对地址，接着调用scanCode:首先对上一个函数返回的entry进行循环，调用parseVue函数获取到ast文件，接着调用_findImportItems函数，检查希望检测代码中的所有满足条件的import存入到importItemMap中,运行_dealAST对代码做详细检查，判断当前token是否是满足条件的被import过来的依赖项，），之后检查ts
//     - 对黑名单API做检查
