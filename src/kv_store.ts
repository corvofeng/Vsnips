"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename:kv_store.ts
 *
 *     Version: 1.0
 *  Created on: July 02, 2019
 *
 *      Author: corvo
 *=======================================================================
 */

// 此文件用于保存各种信息.

// 由于Logger还未初始化, 所以此文件中打印只能使用console.log, 不能使用Logger
// import { Logger } from "./logger";

import * as jsLogger from "js-logger";
import * as request from "request";
import * as fs from "fs";
import * as path from "path";

// 用户当前的可以放置配置文件的位置
// Copy from: https://stackoverflow.com/a/26227660
const UserLocalDir =
  process.env.APPDATA ||
  (process.platform === "darwin"
    ? process.env.HOME + "Library/Preferences"
    : process.env.HOME + "/.local/share");
console.log("Get usre dir", UserLocalDir);

// In linux, the default vsnips dir is in:
//     ~/.local/share/Vsnips/
const VsnipDir = path.join(UserLocalDir, "Vsnips");

const UltiSnipsDir = path.join(VsnipDir, "Ultisnips");

if (!fs.existsSync(VsnipDir)) {
  fs.mkdirSync(VsnipDir);
}

if (!fs.existsSync(UltiSnipsDir)) {
  fs.mkdirSync(UltiSnipsDir);
}

let DeafultLang = ["lua", "c", "cpp", "all", "javascript", "python"];

/**
 * 存放snippet片段的文件夹
 */
let SearchDirs = [
  UltiSnipsDir,
  // path.join(process.env.HOME, '.vim', 'UltiSnips'),
  // '/home/corvo/.vim/UltiSnips',
  // '/home/corvo/.vim/plugged/vim-snippets/UltiSnips',
];

// 记录变量的文件, 用户可以指定vimrc
let VarFiles: string[] = [
  // '/home/corvo/.vimrc',
  // '/home/corvo/.vim/common.vim',
];

function DownloadSnips() {
  // Download snippets from: https://github.com/honza/vim-snippets
  DeafultLang.forEach((lang: string) => {
    let snipfile = path.join(UltiSnipsDir, lang + ".snippets");
    if (!fs.existsSync(snipfile)) {
      console.log("Create file: ", snipfile);
      const file = fs.createWriteStream(snipfile);
      const req = request
        .get(
          `https://raw.githubusercontent.com/honza/vim-snippets/master/UltiSnips/${lang}.snippets`
        )
        .pipe(file);
    }
  });
}
DownloadSnips();

// 日志级别, NO表示不打印日志
let LogLevel = "NO";
function setLogLevel(level: string) {
  LogLevel = level;
}

function getLogLevel() {
  let lvl = undefined;
  switch (LogLevel) {
    case "NO":
      break;
    case "DEBUG":
      lvl = jsLogger.DEBUG;
      break;
    case "DEBUG":
      lvl = jsLogger.INFO;
      break;
    default:
      lvl = jsLogger.ERROR;
      break;
  }
  return lvl;
}

function getLogFile() {
  return path.join(VsnipDir, "vsnips.log");
}

function getSnipsDirs() {
  return SearchDirs;
}

function addSnipsDir(dirNames: string[]) {
  SearchDirs = SearchDirs.concat(dirNames);
}

function getVarfiles(): string[] {
  return VarFiles;
}

function addVarfiles(files: string[]) {
  VarFiles = VarFiles.concat(files);
}

export {
  // VsnipDir,
  // UltiSnipsDir,
  setLogLevel,
  getLogLevel,
  getLogFile,
  getSnipsDirs,
  addSnipsDir,
  getVarfiles,
  addVarfiles,
};
