var report={"importItemMap":{"app":{"callOrigin":null,"callFiles":["Code-Demo&src\\pages\\setting.vue","Code-Demo&src\\pages\\Index.vue"]},"request":{"callOrigin":"AppRequest","callFiles":["Code-Demo&src\\pages\\Notification.vue"]},"ActivePage":{"callOrigin":null,"callFiles":["Code-Demo&src\\components\\scTab.vue"]},"APP":{"callOrigin":null,"callFiles":["Code-Demo&src\\components\\IcCards.vue"]},"userInfo":{"callOrigin":null,"callFiles":["Code-Demo&src\\components\\IcCards.vue"]},"a":{"callOrigin":"*","callFiles":["Code-Demo&src\\components\\scrollBar\\index.vue"]},"environment":{"callOrigin":null,"callFiles":["Code-Demo&src\\components\\addVariationDialog\\index.vue"]},"getUser":{"callOrigin":null,"callFiles":["Code-Demo&src\\message.ts"]},"UserEventType":{"callOrigin":null,"callFiles":["Code-Demo&src\\store\\index.ts"]},"Base":{"callOrigin":null,"callFiles":["Code-Demo&src\\services\\connect.ts"]},"router":{"callOrigin":null,"callFiles":["Code-Demo&src\\router\\index.ts"]},"api":{"callOrigin":null,"callFiles":["Code-Demo&src\\api\\index.ts"]},"APIPromise":{"callOrigin":null,"callFiles":["Code-Demo&src\\api\\index.ts"]}},"versionMap":{},"parseErrorInfos":[{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blobsrc\\pages\\BasicSettings.vue","file":"src\\pages\\BasicSettings.vue","stack":"SyntaxError: Element is missing end tag.\n    at createCompilerError (D:\\myCode\\大四上\\Front-end-code-analysis\\node_modules\\@vue\\compiler-core\\dist\\compiler-core.cjs.js:1364:17)\n    at emitError (D:\\myCode\\大四上\\Front-end-code-analysis\\node_modules\\@vue\\compiler-core\\dist\\compiler-core.cjs.js:2949:5)\n    at Object.onclosetag (D:\\myCode\\大四上\\Front-end-code-analysis\\node_modules\\@vue\\compiler-core\\dist\\compiler-core.cjs.js:2308:13)\n    at Tokenizer.stateInClosingTagName (D:\\myCode\\大四上\\Front-end-code-analysis\\node_modules\\@vue\\compiler-core\\dist\\compiler-core.cjs.js:785:16)\n    at Tokenizer.parse (D:\\myCode\\大四上\\Front-end-code-analysis\\node_modules\\@vue\\compiler-core\\dist\\compiler-core.cjs.js:1143:16)\n    at Object.baseParse (D:\\myCode\\大四上\\Front-end-code-analysis\\node_modules\\@vue\\compiler-core\\dist\\compiler-core.cjs.js:2988:13)\n    at Object.parse (D:\\myCode\\大四上\\Front-end-code-analysis\\node_modules\\@vue\\compiler-dom\\dist\\compiler-dom.cjs.js:904:23)\n    at parseVue (file:///D:/myCode/%E5%A4%A7%E5%9B%9B%E4%B8%8A/Front-end-code-analysis/lib/parse.js:17:32)\n    at file:///D:/myCode/%E5%A4%A7%E5%9B%9B%E4%B8%8A/Front-end-code-analysis/lib/analysis.js:563:50\n    at Array.forEach (<anonymous>)"}],"scoreMap":{"score":83,"message":["location.href属于黑名单api，请勿使用","app.localStorage.set属于黑名单api，请勿使用","import * as a 属于非建议导入方式，建议修改","document.documentElement.style.overflow 属于Dom类型操作api，建议评估影响慎重使用","document.getElementById 属于Dom类型操作api，建议评估影响慎重使用","window.addEventListener 属于全局类型api，建议请评估影响慎重使用","window.FB.login 属于全局类型api，建议请评估影响慎重使用","location.href 属于路由类操作，请使用框架提供的Router API代替","1 个文件解析&分析AST时发生错误，请修复"]},"reportTitle":"Code-Demo代码分析报告","analysisTime":"2025.03.17 17:05:29","mapNames":["methodMap","typeMap","apiMap","browserMap"],"methodMap":{"app.cookie.set":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\pages\\setting.vue":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[99]}}},"app.cookie.get":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\pages\\setting.vue":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[111]}}},"app.localStorage.get":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\pages\\Index.vue":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[26]}}},"app.localStorage.set":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\pages\\Index.vue":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[29]}},"isBlack":true},"router.addRouterModule":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\router\\index.ts":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[3]}}},"api.commonRequest.get":{"callNum":2,"callOrigin":null,"callFiles":{"Code-Demo&src\\api\\index.ts":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[6,10]}}}},"typeMap":{"UserEventType":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\store\\index.ts":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[41]}}},"APIPromise":{"callNum":2,"callOrigin":null,"callFiles":{"Code-Demo&src\\api\\index.ts":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[5,9]}}}},"apiMap":{"[object Object]":{"callNum":5,"callFiles":{"0":{"projectName":"Base","httpRepo":{"origin":null,"symbolPos":8,"symbolEnd":13,"indentifierPos":8,"indentifierEnd":13},"lines":["Code-Demo&src\\services\\connect.ts"]},"1":{"projectName":"userInfo.name","httpRepo":{"origin":null,"symbolPos":173,"symbolEnd":182,"indentifierPos":173,"indentifierEnd":182},"lines":["Code-Demo&src\\components\\IcCards.vue"]},"3":{"projectName":"app.a.b.c","httpRepo":{"origin":null,"symbolPos":81,"symbolEnd":85,"indentifierPos":81,"indentifierEnd":85},"lines":["Code-Demo&src\\pages\\Index.vue"]}}}},"browserMap":{"document.documentElement.style.overflow":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\pages\\setting.vue":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[112]}}},"document.getElementById":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\components\\scrollBar\\index.vue":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[41]}}},"window.addEventListener":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\components\\scrollBar\\index.vue":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[80]}}},"window.FB.login":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\services\\connect.ts":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[38]}}},"location.href":{"callNum":1,"callOrigin":null,"callFiles":{"Code-Demo&src\\router\\index.ts":{"projectName":"Code-Demo","httpRepo":"https://github.com/liangxin199045/code-demo/blob","lines":[18]}},"isBlack":true}}}