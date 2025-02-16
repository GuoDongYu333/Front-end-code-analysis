import fs from "fs";
import path from "path";
import { glob } from "glob";

/**
 * 扫描指定目录下的ts和tsx文件
 * @param scanPath 目录路径
 * @returns ts和tsx文件列表
 */
export const scanFiles = (scanPath) => {
  try {
    const tsFiles = glob.sync(path.join(process.cwd(), `${scanPath}/**/*.ts`));
    const tsxFiles = glob.sync(
      path.join(process.cwd(), `${scanPath}/**/*.tsx`)
    );
    return [...tsFiles, ...tsxFiles];
  } catch (error) {
    throw error;
  }
};

/**
 * 扫描指定目录下的vue文件
 * @param scanPath 目录路径
 * @returns vue文件列表
 */
export const scanVueFiles = (scanPath) => {
  try {
    return glob.sync(path.join(process.cwd(), `${scanPath}/**/*.vue`));
  } catch (error) {
    throw error;
  }
};

/**
 * 获取JSON文件内容
 * @param fileName 文件名称
 * @returns 文件内容
 */
export const getJSONContent = (fileName) => {
  try {
    const content = JSON.parse(
      fs.readFileSync(`${path.join(process.cwd(), fileName)}`, "utf-8")
    );
    return content;
  } catch (error) {
    throw error;
  }
};

/**
 * 获取代码文件内容
 * @param fileName 文件名称
 * @returns 文件内容
 */
export const getCodeFile = (fileName) => {
  try {
    const code = fs.readFileSync(fileName, "utf-8");
    return code;
  } catch (error) {
    throw error;
  }
};

/**
 * 写入ts文件
 * @param fileName 文件名称
 * @param content 文件内容
 */
export const writeTsFile = (fileName, content) => {
  try {
    fs.writeFileSync(
      path.join(process.cwd(), `${fileName}.ts`),
      content,
      "utf8"
    );
  } catch (error) {
    throw error;
  }
};

/**
 * 创建目录
 * @param dirName 目录名称
 */
export const mkDir = (dirName) => {
  try {
    fs.mkdirSync(path.join(process.cwd(), `/${dirName}`), { recursive: true });
  } catch (error) {
    throw error;
  }
};

/**
 * 删除目录
 * @param dirName 目录名称
 */
export const rmDir = (dirName) => {
  try {
    const dirPath = path.join(process.cwd(), `/${dirName}`);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        let curPath = path.join(dirPath, file);
        if (fs.statSync(curPath).isDirectory()) {
          rmDir(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  } catch (error) {
    throw error;
  }
};
