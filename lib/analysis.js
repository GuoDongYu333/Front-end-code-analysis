import path from "path";
import tsCompiler from "typescript";
import { scanFiles, scanVueFiles, getJSONContent } from "./file";
import { parseTs, parseVue } from "./parse";

class CodeAnalysis {
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

  _blackTag(queue) {
    if(queue.length > 0){
        queue.forEach((item)=>{
            Object.keys(this[item.mapName]).forEach((apiName)=>{
                if(this._blackList.length>0 && this._blackList.includes(apiName)){
                    this[item.mapName][apiName].isBlack = true;
                }
            })
        })
    }
  }
}
