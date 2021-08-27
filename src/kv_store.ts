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
// import * as request from "request";
import * as fs from "fs";
import * as path from "path";
import { Snippet } from "./parse";

// 用户当前的可以放置配置文件的位置
// Copy from: https://stackoverflow.com/a/26227660
const UserLocalDir =
  process.env.APPDATA ||
  (process.platform === "darwin"
    ? process.env.HOME + "/Library/Preferences"
    : process.env.HOME + "/.local/share");
// eslint-disable-next-line
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

/**
 * 展示snippet的策略:
 *  ALL: 表示每次均展示所有snippets
 *  PREFIX: 表示只匹配前缀相同的snippet
 *  TODO: Add other strategies.
 */
let DisplayStrategy: string = "ALL";

/**
 * 用户自定义的触发键位, 示例: ['v', 'V']
 *
 * 不推荐用户自定义, 会导致其他补全功能失效, 请查看:
 *    https://github.com/corvofeng/Vsnips/commit/e2493bf9747b4e75a5c72d4fcfd07fe402de6f1e
 */
let Trigers: string[] = [];

let UserScriptFiles: string[] = [];

const AUTO_TRIGGERED_SNIPS: Snippet[] = [];

let ENABLE_AUTO_TRIGGER: boolean = false;

// 日志级别, NO表示不打印日志
let LogLevel = "NO";
function setLogLevel(level: string) {
  LogLevel = level;
}

function getLogLevel() {
  let lvl;
  switch (LogLevel) {
    case "NO":
      break;
    case "DEBUG":
      // @ts-ignore
      lvl = jsLogger.DEBUG;
      break;
    case "INFO":
      // @ts-ignore
      lvl = jsLogger.INFO;
      break;
    case "WARN":
      // @ts-ignore
      lvl = jsLogger.WARN;
      break;
    case "ERROR":
      // @ts-ignore
      lvl = jsLogger.ERROR;
      break;
    default:
      // @ts-ignore
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

function clearSnipsDir() {
  SearchDirs = [];
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

/**
 * 创建如下的配置文件, 使得VScode打开时为 Multi-root Workspaces
 * {
 *  "folders": [
 *    {
 *      "path": "Ultisnips"
 *    },
 *    {
 *      "path": "... UltiSnips"
 *    }
 *  ],
 *  "settings": {}
 * }
 */
function updateMultiWorkspaceSetting() {
  const myWorkspaceConfig = path.join(VsnipDir, "snips.code-workspace");
  const writeJSON = {
    folders: [
      {
        path: "/home/corvo/.local/share/Vsnips/Ultisnips",
      },
      {
        path: "/home/corvo/.vim/UltiSnips",
      },
    ],
    settings: {},
  };
  getSnipsDirs().forEach((snipDir) => {
    writeJSON.folders.push({ path: snipDir });
  });
  fs.writeFile(myWorkspaceConfig, JSON.stringify(writeJSON), (err) => {
    // eslint-disable-next-line
    console.log("Can't write workspace config", err);
  });
  return myWorkspaceConfig;
}

function addUserScriptFiles(files: string[]) {
  UserScriptFiles = UserScriptFiles.concat(files);
}
function getUserScriptFiles(): string[] {
  return UserScriptFiles;
}

function setDisplayStrategy(strategy: string) {
  DisplayStrategy = strategy;
}
function getDisplayStrategy(): string {
  return DisplayStrategy;
}
function setTrigers(trigers: string[]) {
  Trigers = trigers;
}
function getTrigers(): string[] {
  return Trigers;
}

function addAutoTriggeredSnips(snip: Snippet) {
  AUTO_TRIGGERED_SNIPS.push(snip);
}

function getAutoTriggeredSnips(): Snippet[] {
  return AUTO_TRIGGERED_SNIPS;
}

function setEnableAutoTrigger(eat: boolean) {
  ENABLE_AUTO_TRIGGER = eat;
}
function getEnableAutoTrigger(): boolean {
  return ENABLE_AUTO_TRIGGER;
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
  clearSnipsDir,
  getUserScriptFiles,
  addUserScriptFiles,
  setDisplayStrategy,
  getDisplayStrategy,
  setTrigers,
  getTrigers,
  addAutoTriggeredSnips,
  getAutoTriggeredSnips,
  setEnableAutoTrigger,
  getEnableAutoTrigger,
  updateMultiWorkspaceSetting,
};
