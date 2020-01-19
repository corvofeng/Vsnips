"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename: box.spec
 *
 *     Version: 1.0
 *  Created on: January 12, 2020
 *
 *      Author: corvo
 *=======================================================================
 */

import { expect } from 'chai';
import 'mocha';
import { Logger, InitLogger } from "../../logger";
import { setLogLevel } from "../../kv_store";
import { FuncArg, TsFuncToken, GoFuncToken } from "../../doc_parse/token_obj";
import { Box } from '../../box/box';
import { Position } from 'vscode';


describe("Box change", () => {
  let simpleBox = new Box();
  beforeEach(function (done) {
    setLogLevel('DEBUG');
    InitLogger();
    // simpleBox.initSnip();
    simpleBox.boxContents = [
      "// ┌──┐",
      "// | $1 |",
      "// └──┘"
    ];
    simpleBox.leftUpPos = new Position(0, 0);
    simpleBox.rightBottomPos = new Position(2, 6);
    done();
  });

  it('Delte multiline', () => {
    expect(1).eq(1);
  });
});

