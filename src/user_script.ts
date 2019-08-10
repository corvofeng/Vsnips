"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename: user_script.ts
 *
 *     Version: 1.0
 *  Created on: August 01, 2019
 *
 *      Author: corvo
 *=======================================================================
 */
import { Logger } from "./logger";
import * as fs from "fs";

// 允许用户定义自己的函数
let USER_SCRIPT_FILE = ["/home/corvo/.vim/UltiSnips/func.js"];

// 记录函数对应关系
// Map<string, function>
let USER_MODULE = new Map();

function jsParser() {
  USER_SCRIPT_FILE.forEach(jsFile => {
    if (!fs.existsSync(jsFile)) {
      Logger.warn(`The ${jsFile} not exists, stop parse js file!!`);
      return;
    }

    const data = fs.readFileSync(jsFile, "utf8");
    Logger.debug(data);

    let userJSFunc = undefined as any;
    (function forEval() {
      // 使用eval时, eval的context会与当前环境保持一致,
      // 所以需要为用户预定义一些函数, 以便用户直接调用.
      const LOG = Logger;
      userJSFunc = eval(data) as object;
    })();
    Logger.debug("Get user js func: ", userJSFunc);

    // 将用户的函数记录在我们的模块中, 以供调用
    Object.keys(userJSFunc).forEach((funcName: string) => {
      USER_MODULE.set(funcName, (userJSFunc as any)[funcName]);
    });
  });
}

function main() {
  jsParser();
}

if (require.main === module) {
  main();
}

export { jsParser, USER_MODULE };
