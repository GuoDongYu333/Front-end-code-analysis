import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsFile, writeJsonFile } from "./file.js";
import {
  TEMPLATEDIR,
  REPORTFILENAME,
  REPORTJSPRE,
  DIAGNOSISREPORTFILENAME,
} from "./constant.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const writeReport = (dir, content, templatePath = "") => {
  try {
    fs.mkdirSync(path.join(process.cwd(), `/${dir}`), 0o777);
    if (templatePath && templatePath != "") {
      fs.writeFileSync(
        path.join(process.cwd(), `/${dir}/${REPORTFILENAME}.html`),
        fs.readFileSync(path.join(process.cwd(), `${templatePath}`))
      );
    } else {
      fs.writeFileSync(
        path.join(process.cwd(), `/${dir}/${REPORTFILENAME}.html`),
        fs.readFileSync(
          path.join(__dirname, `../${TEMPLATEDIR}/${REPORTFILENAME}.html`)
        )
      );
    }
    writeJsFile(REPORTJSPRE, content, `${dir}/${REPORTFILENAME}`);
    writeJsonFile(`${dir}/${REPORTFILENAME}`, content);
  } catch (e) {
    throw e;
  }
};
// 输出诊断报告
export const writeDiagnosisReport = (dir, content) => {
  try {
    console.log(dir, "这是相机俺的");

    writeJsonFile(`${dir}/${DIAGNOSISREPORTFILENAME}`, content);
  } catch (e) {
    throw e;
  }
};
