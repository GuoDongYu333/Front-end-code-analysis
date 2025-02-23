import path from "path";
import tsCompiler from "typescript";
import { scanTSFiles, scanVueFiles, getJSONContent } from "./file";
import { parseTs, parseVue } from "./parse";
import {
  defaultPlugin,
  methodPlugin,
  typePlugin,
  browserPlugin,
} from "../plugin/index.js";
import { CODEFILETYPE } from "../lib/constant.js";

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

  _scanCode(scanSource, type) {}

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
   * 入口函数
   */
  analysis() {
    this._installPlugin(this._analysisPlugins);
    if (this._isScanVue) {
      this._scanCode(this._scanSource, CODEFILETYPE.VUE);
    }
  }
}
