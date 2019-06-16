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
jsLogger.setHandler(function(messages, context) {
  const msg: string = Array.prototype.slice
    .call(messages, 0)
    .map(ObjectToString)
    .join(" ");

  const formatLog = `[${context.level.name[0]}] ${msg}\n`;

//   console.log(formatLog);
  VsnipsStream.write(formatLog);
});

export { myLogger as Logger };
