import path, { parse } from "path";
import tsCompiler from "typescript";
import { scanTSFiles, scanVueFiles, getJSONContent } from "./file.js";
import { parseTs, parseVue } from "./parse.js";
import {
  defaultPlugin,
  methodPlugin,
  typePlugin,
  browserPlugin,
} from "../plugin/index.js";
import { CODEFILETYPE } from "../lib/constant.js";
import chalk from "chalk";

export class CodeAnalysis {
  constructor(options) {
    this._scanSource = options.scanSource;
    this._analysisTarget = options.analysisTarget;
    this._blackList = options.blackList || [];
    this._browserApis = options.browserApis || [];
    this._isScanVue = options.isScanVue || false;
    this._sourcePlugin = options.sourcePlugin || null;
    this._analysisPlugins = options.analysisPlugins || [];
    this.pluginQueue = [];
    this.browserQueue = [];
    this.importItemMap = {};
    this.versionMap = {};
    this.parseErrorInfos = [];
    this.diagnosisInfos = [];
    this.scoreMap = {};
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
      this.browserQueue.push(browserPlugin(this));
    }
    console.log(chalk.bgGreen("插件安装完成"));
  }

  _checkPropertyAccess(node, index = 0, apiName = "") {}

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
  ) {}

  _runAnalysisPluginsHook(
    importItems,
    ast,
    checker,
    filePath,
    projectName,
    httpRepo,
    baseLine
  ) {}

  _findImportItems(ast, filePath, baseLine = 0) {
    let importItems = {};
    let that = this;
    function dealImports(temp) {
      importItems[temp.name] = {
        origin: temp.origin,
        symbolPos: temp.symbolPos,
        symbolEnd: temp.symbolEnd,
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
      tsCompiler.forEachChild(node, walk);
      const line =
        ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;
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
            //默认全局导入 import * as xxx from 'ABC'
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

  _dealAST(importItems, ast, checker, baseLine = 0) {
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
   * @param {*} scanSource 扫描源
   * @param {*} type 文件类型
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

  _scanCode(scanSource, type) {
    let entrys = this._scanFiles(scanSource, type);
    entrys.forEach((item) => {
      const parseFiles = item.parse;
      if (parseFiles.length > 0) {
        parseFiles.forEach((element, eIndex) => {
          //获取Code-Demo&src\message.ts这样的路径
          const showPath = item.name + "&" + item.show[eIndex];
          try {
            if (type === CODEFILETYPE.VUE) {
              const { ast, checker, baseLine } = parseVue(element);
              const importItems = this._findImportItems(
                ast,
                showPath,
                baseLine
              );
              this._dealAST(importItems, ast, checker, baseLine);
            }
          } catch (error) {
            // console.log(error);
            // throw error;
          }
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
  analysis() {
    this._installPlugin(this._analysisPlugins);
    if (this._isScanVue) {
      this._scanCode(this._scanSource, CODEFILETYPE.VUE);
    }
    this._scanCode(this._scanSource, CODEFILETYPE.TS);
  }
}
