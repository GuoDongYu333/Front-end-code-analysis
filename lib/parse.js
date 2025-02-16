import { md5 } from "js-md5";
import path from "path";
import tsCompiler from "typescript";
import { getCodeFile, writeTsFile } from "./file.js";
import vueCompiler from "@vue/compiler-dom";
import { VUETEMPTSDIR } from "./constant.js";

export const parseVue = (fileName) => {
  try {
    const vueCode = getCodeFile(fileName);
    const result = vueCompiler.parse(vueCode);
    const children = result.children;

    let tsCode = "";
    let baseLine = 0;
    children.forEach((child) => {
      //@ts-ignore
      if (child.tag === "script") {
        //@ts-ignore
        tsCode = child.children[0].content;
        baseLine = child.loc.start.line - 1;
      }
    });
    const ts_hash_name = md5(fileName);
    writeTsFile(`${VUETEMPTSDIR}/${ts_hash_name}`,tsCode);
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
