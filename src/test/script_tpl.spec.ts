"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename: script_tpl.spec.ts
 *
 *     Version: 1.0
 *  Created on: December 02, 2019
 *
 *      Author: corvo
 *=======================================================================
 */

import { expect } from "chai";
import { var_parser, getVimVar, jsFuncDecorator } from "../script_tpl";
import { InitLogger, Logger } from "../logger";
import { setLogLevel } from "../kv_store";

describe("Parse vim config", () => {
  beforeEach(done => {
    setLogLevel("WARN");
    InitLogger();
    done();
  });

  it("Test read vim config", () => {
    const TEST_VARS = [
      // only number
      [`let g:ale_set_loclist = 1`, "ale_set_loclist", 1],

      [`let g:snips_author="corvo"`, "snips_author", "corvo"],

      // string with single quotes
      [
        `let g:ale_echo_msg_error_str = 'Error'`,
        "ale_echo_msg_error_str",
        "Error"
      ],

      // string with single quotes
      [
        `let g:ale_cpp_clangtidy_options = "p ./build/"`,
        "ale_cpp_clangtidy_options",
        "p ./build/"
      ],

      // string with comments
      [
        `let g:winManagerWindowLayout='NERDTree|TagList' "BufExplorer`,
        "winManagerWindowLayout",
        "NERDTree|TagList"
      ],

      [
        `let g:ultisnips_python_style="google"       " python注释风格`,
        "ultisnips_python_style",
        "google"
      ]
    ];
    TEST_VARS.forEach(varDef => {
      const [express, key, value] = varDef;
      var_parser(express as string);
      expect(getVimVar(key as string) === value);
    });
  });

  it("Test js func decorator", () => {
    InitLogger();
    const TEST_VARS = [
      ["js_get_simple_box", [], "`!js js_get_simple_box`"],
      [
        "js_get_simple_box",
        ["arg1", "arg2", "arg3"],
        '`!js js_get_simple_box ["arg1","arg2","arg3"]`'
      ]
    ];
    TEST_VARS.forEach(varDef => {
      const [fName, fArgs, ret] = varDef;
      expect(jsFuncDecorator(fName as string, fArgs as string[])).eq(ret);
    });
  });
});
