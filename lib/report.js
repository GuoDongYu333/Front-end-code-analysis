import fs from "fs";
import path from "path";
import { writeJsFile, writeJsonFile } from "./file";
import {
  TEMPLATEDIR,
  REPORTFILENAME,
  REPORTJSPRE,
  DIAGNOSISREPORTFILENAME,
} from "./constant";

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
    writeJsonFile(content, `${dir}/${REPORTFILENAME}`);
  } catch (e) {
    throw e;
  }
};
// 输出诊断报告
export const writeDiagnosisReport = (dir, content) => {
  try {
    writeJsonFile(content, `${dir}/${DIAGNOSISREPORTFILENAME}`);
  } catch (e) {
    throw e;
  }
};
