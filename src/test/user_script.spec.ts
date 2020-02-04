"use strict";

// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename: user_script.spec
 *
 *     Version: 1.0
 *  Created on: February 03, 2020
 *
 *      Author: corvo
 *=======================================================================
 */

import * as path from "path";
import { setLogLevel } from "../kv_store";
import { InitLogger, Logger } from "../logger";
import { USER_MODULE, jsParser } from "../user_script";

describe("User script spec", () => {
  beforeEach(done => {
    setLogLevel("DEBUG");
    InitLogger();
    done();
  });
  it("parse user script", () => {
    const testScriptfiles = [path.join(__dirname,"..", "..", "example/func.js")];
    jsParser(testScriptfiles);
    Logger.info("Get user module", USER_MODULE);
  });
});
