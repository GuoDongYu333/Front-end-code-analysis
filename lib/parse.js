import { md5 } from "js-md5";
import path from "path";
import tsCompiler from "typescript";
import { getCodeFile, writeTsFile } from "./file.js";
import vueCompiler from "@vue/compiler-dom";
import { VUETEMPTSDIR } from "./constant.js";
import chalk from "chalk";

/**
 * 解析 Vue 文件中的 <script> 代码块，生成 TypeScript AST
 * @param fileName 文件名称
 * @returns 返回ast，checker，baseLine
 */
export const parseVue = (fileName) => {
  try {
    const vueCode = getCodeFile(fileName);
    const result = vueCompiler.parse(vueCode);
    const children = result.children;
    let tsCode = "";
    let baseLine = 0;
    children.forEach((child) => {
      if (child.tag === "script") {
        tsCode = child.children[0].content;
        baseLine = child.loc.start.line - 1;
      }
    });
    let ts_hash_name;
    ts_hash_name = md5(fileName);
    writeTsFile(`${VUETEMPTSDIR}/${ts_hash_name}`, tsCode);
    const vue_temp_ts_name = path.join(
      process.cwd(),
      `${VUETEMPTSDIR}/${ts_hash_name}.ts`
    );
    const program = tsCompiler.createProgram([vue_temp_ts_name], {});
    const ast = program.getSourceFile(vue_temp_ts_name);
    const checker = program.getTypeChecker();
    return { ast, checker, baseLine };
  } catch (error) {
    throw error;
  }
};

/**
 * 解析ts文件，生成ast，checker
 * @param {*} fileName
 * @returns ast, checker
 */
export const parseTs = (fileName) => {
  try {
    const program = tsCompiler.createProgram([fileName], {});
    const ast = program.getSourceFile(fileName);
    const checker = program.getTypeChecker();
    return { ast, checker };
  } catch (error) {
    throw error;
  }
};
