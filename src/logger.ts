"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename:logger.ts
 *
 *     Version: 1.0
 *  Created on: October 24, 2018
 *
 *      Author: fengyuhao
 *=======================================================================
 */

// You must install newly js-logger
// Refer to this:
// Github: jonnyreeves/js-logger
//      master  => test-src/typescript-consumer/index.ts
import * as jsLogger from "js-logger";
import { ILogger } from "js-logger";
import { getLogFile, getLogLevel, initLogDir, isInBrowser } from "./kv_store";
import * as fs from "fs";

jsLogger.useDefaults();

const myLogger: ILogger = jsLogger.get("Vsnips");


function ObjectToString(input: object | string): string {
  if (input instanceof Object) {
    const ret = JSON.stringify(input);
    if (ret !== '{}') {
      return JSON.stringify(input);
    }

    const nextTry = new Map();
    Object.keys(input).forEach((key: string) => {
      const val = (input as any)[key];
      // 如果val的类型是函数
      if (typeof val === 'function') {
        nextTry.set(key, val.name);
      } else {
        // eslint-disable-next-line
        console.log("Now we get ", val, "But can't parse");
      }
    });
    return JSON.stringify([...nextTry]);
  }
  return input as string;
}

/**
 * 测试时我一般开DEBUG日志, 想要过滤可以使用下面的语句, grep + 正则可以过滤其他级别的日志
 *  `tail -F ~/.local/share/Vsnips/vsnips.log | grep '\[[IW]\]'`
 *
 * 具体的日志样式如下:
 *  2019-07-31 08:21:32: [I] Repush the pip-requirementsfrom local dir
 *
 */
function InitLogger() {

  let VsnipsStream: fs.WriteStream | null = null;  
  if (!isInBrowser()) {
    initLogDir();
    VsnipsStream = fs.createWriteStream(getLogFile(), { flags: "a" });
  }

  const lvl = getLogLevel();

  if (lvl !== undefined) {
    myLogger.setLevel(lvl);
    jsLogger.setHandler(function (messages, context) {
      const msg: string = Array.prototype.slice
        .call(messages, 0)
        .map(ObjectToString)
        .join(" ");

      const today = new Date();
      const date = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + today.getDate();
      const time = ('0' + today.getHours()).slice(-2) + ":" + ('0' + today.getMinutes()).slice(-2) + ":" + ('0' + today.getSeconds()).slice(-2);

      const formatLog = `${date} ${time}: [${context.level.name[0]}] ${msg}\n`;
      // eslint-disable-next-line
      console.log(formatLog);
      if (VsnipsStream) {
        VsnipsStream.write(formatLog);
      }
    });
  } else {
    // @ts-ignore
    myLogger.setLevel(jsLogger.ERROR);
  }
}

export { myLogger as Logger, InitLogger };
