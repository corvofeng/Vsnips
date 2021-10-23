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
import {
  var_parser,
  getVimVar,
  jsFuncDecorator,
  initTemplateFunc,
  initVimVar,
  getTemplateFunc
} from "../script_tpl";
import { Logger, InitLogger } from "../logger";
import { setLogLevel } from "../kv_store";
import { VSnipContext } from "../vsnip_context";
import * as vscode from "vscode";

describe("Parse vim config", () => {
  beforeEach(done => {
    setLogLevel("WARN");
    InitLogger();
    done();
  });

  it("Test read vim config", () => {
    const TEST_VARS = [
      // only number
      [`let g:ale_set_loclist = 1`, "ale_set_loclist", '1'],

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
      ],
      [`let g:fzf_action = {
  \\ 'ctrl-t': 'tab split',
  \\ 'ctrl-s': 'split',
  \\ 'ctrl-v': 'vsplit' }]`,
        'fzf_action',
        ''
      ]
    ];
    TEST_VARS.forEach(varDef => {
      const [express, key, value] = varDef;
      expect(var_parser(express as string) === true);
      expect(getVimVar(key as string)).to.equal(value);
    });
  });

  it("Test js func decorator", () => {
    InitLogger();
    const TEST_VARS = [
      ["js_get_simple_box", [], "`!js js_get_simple_box`"],
      [
        "js_get_simple_box",
        ["arg1", "arg2", "arg3"],
        '`!js js_get_simple_box("arg1","arg2","arg3")`'
      ],
      [
        "js_get_simple_box",
        [`arg with "quote"`],
        '`!js js_get_simple_box("arg with \\"quote\\"")`'
      ],
    ];
    TEST_VARS.forEach(varDef => {
      const [fName, fArgs, ret] = varDef;
      expect(jsFuncDecorator(fName as string, fArgs as string[])).eq(ret);
    });
  });

  // Test some files
  // it("Test vscode context", () => {
  //   setLogLevel("DEBUG");
  //   InitLogger();
  //   initVimVar(["/home/corvo/.vim/nvim-init.vim"]);
  // }),

  it("Test vscode context", () => {
    const ExampleVSCntext = new VSnipContext(
      {
        uri: vscode.Uri.parse("/home/corvo/Project/WebTools/README.md"),
        fileName: "/home/corvo/Project/WebTools/README.md",
        isUntitled: false,
        languageId: "markdown",
        version: 8,
        isClosed: false,
        isDirty: true,
        eol: 1,
        lineCount: 1
      } as vscode.TextDocument,
      {
        line: 0,
        character: 1
      } as vscode.Position,
      {} as vscode.CancellationToken,
      {} as vscode.CompletionContext
    );

    initTemplateFunc();
    const func = getTemplateFunc("js_markdown_title");
    expect(func(ExampleVSCntext)).eq("README");
  });

  it("Test js_get_vim_expand", () => {
    initTemplateFunc();
    const func = getTemplateFunc("js_get_vim_expand");

    const TEST_VARS = [
      ["", "", ""],
      ["/abc/def/my.txt", "%:p:h", "/abc/def"],
      ["/abc/def/my.txt", "%:p:h:t", "def"],
      ["/abc/def/my.txt", "%:r", "my"],
    ];
    TEST_VARS.forEach(([_fn, _arg, _rlt]) => {
      const exampleVSCntext = new VSnipContext(
        {
          fileName: _fn,
        } as vscode.TextDocument,
        {
          line: 0,
          character: 1
        } as vscode.Position,
        {} as vscode.CancellationToken,
        {} as vscode.CompletionContext
      );
      expect(func(exampleVSCntext, _arg)).eq(_rlt);
    });
  });
});
