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

import { expect } from 'chai';
import { var_parser, getVimVar } from "../script_tpl";
import { Logger, InitLogger } from "../logger";
import { setLogLevel } from "../kv_store";


describe("Parse vim config", () => {
  beforeEach(function (done) {
    setLogLevel('WARNING');
    InitLogger();
    done();
  });

  it("Test read vim config", () => {
    let TEST_VARS = [
      // only number
      [`let g:ale_set_loclist = 1`, 'ale_set_loclist', 1],

      [`let g:snips_author="corvo"`, 'snips_author', 'corvo'],

      // string with single quotes
      [`let g:ale_echo_msg_error_str = 'Error'`, 'ale_echo_msg_error_str', 'Error'],

      // string with single quotes
      [`let g:ale_cpp_clangtidy_options = "p ./build/"`, 'ale_cpp_clangtidy_options', 'p ./build/'],

      // string with comments
      [`let g:winManagerWindowLayout='NERDTree|TagList' "BufExplorer`, 'winManagerWindowLayout', 'NERDTree|TagList'],

      [`let g:ultisnips_python_style="google"       " python注释风格`, 'ultisnips_python_style', 'google'],
    ];
    TEST_VARS.forEach(varDef => {
      let [express, key, value] = varDef;
      var_parser(express as string);
      expect(getVimVar(key as string) === value)
    });
  });
});
