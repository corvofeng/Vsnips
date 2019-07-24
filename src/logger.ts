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
import { ILogger } from "js-logger/src/types";

import * as fs from "fs";

jsLogger.useDefaults();

const myLogger: ILogger = jsLogger.get("Vsnips");

var VsnipsStream = fs.createWriteStream("/tmp/vsnips.log", { flags: "a" });

function ObjectToString(input: object | string): string {
  if (input instanceof Object) {
    return JSON.stringify(input);
  } else {
    return input;
  }
}

myLogger.setLevel(jsLogger.DEBUG);
// myLogger.setLevel(jsLogger.INFO);
jsLogger.setHandler(function (messages, context) {
  const msg: string = Array.prototype.slice
    .call(messages, 0)
    .map(ObjectToString)
    .join(" ");

  let today = new Date();
  let date = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + today.getDate();
  let time = ('0' + today.getHours()).slice(-2) + ":" + ('0' + today.getMinutes()).slice(-2) + ":" + ('0' + today.getSeconds()).slice(-2);

  const formatLog = `${date} ${time}: [${context.level.name[0]}] ${msg}\n`;
  console.log(formatLog);
  VsnipsStream.write(formatLog);
});

export { myLogger as Logger };
