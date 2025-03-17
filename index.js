import fs from "fs";
import path from "path";
import { VUETEMPTSDIR } from "./lib/constant.js";
import { mkDir, rmDir } from "./lib/file.js";
import { parseTs, parseVue } from "./lib/parse.js";
import { CodeAnalysis } from "./lib/analysis.js";
import { glob } from "glob";

const test1 = new CodeAnalysis({
  scanSource: [
    {
      // 必须，待扫描源码的配置信息
      name: "Code-Demo", // 必填，项目名称
      path: ["src"], // 必填，需要扫描的文件路径（基准路径为配置文件所在路径）
      packageFile: "package.json", // 可选，package.json 文件路径配置，用于收集依赖的版本信息
      format: null, // 可选, 文件路径格式化函数,默认为null,一般不需要配置
      httpRepo: `https://github.com/liangxin199045/code-demo/blob/`, // 可选，项目gitlab/github url的访问前缀，用于点击行信息跳转，不填则不跳转
    },
    // {
    //   name: "Code-Demo2", // 必填，项目名称
    //   path: ["src2"], // 必填，需要扫描的文件路径（基准路径为配置文件所在路径）
    //   packageFile: "package.json", // 可选，package.json 文件路径配置，用于收集依赖的版本信息
    //   format: null, // 可选, 文件路径格式化函数,默认为null,一般不需要配置
    //   httpRepo: `https://github.com/liangxin199045/code-demo/blob/222`, // 可选，项目gitlab/github url的访问前缀，用于点击行信息跳转，不填则不跳转
    // },
  ],
  analysisTarget: "framework", // 必须，要分析的目标依赖名
  analysisPlugins: [], // 可选，自定义分析插件，默认为空数组，一般不需要配置
  blackList: ["app.localStorage.set", "location.href"], // 可选，需要标记的黑名单api，默认为空数组
  browserApis: ["window", "document", "history", "location"], // 可选，要分析的BrowserApi，默认为空数组
  reportDir: "docs", // 可选，生成代码分析报告的目录，默认为'report',不支持多级目录配置
  reportTitle: "Code-Demo代码分析报告", // 可选，代码分析报告标题，默认为'代码依赖分析报告'
  isScanVue: true, // 可选，是否要扫描分析vue中的ts代码，默认为false
  scorePlugin: "default", // 可选，评分插件: Function|'default'|null, default表示运行默认插件，默认为null表示不评分
  // scorePlugin: myScoreDeal,
  alarmThreshold: 90,
});

console.log(test1.analysis());
