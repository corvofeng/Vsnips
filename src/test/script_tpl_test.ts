"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename:script_tpl_test.ts
 *
 *     Version: 1.0
 *  Created on: July 20, 2019
 *
 *      Author: corvo
 *=======================================================================
 */

import { VSnipContext } from "../vsnip_context";
import { js_markdown_title } from "../script_tpl";
import { Logger } from "../logger";
import * as vscode from "vscode";

let example_vs_context = new VSnipContext(
  <vscode.TextDocument>{
    uri: vscode.Uri.parse("/home/corvo/Project/WebTools/README.md"),
    fileName: "/home/corvo/Project/WebTools/README.md",
    isUntitled: false,
    languageId: "markdown",
    version: 8,
    isClosed: false,
    isDirty: true,
    eol: 1,
    lineCount: 1
  },
  <vscode.Position>{
    line: 0,
    character: 1
  },
  <vscode.CancellationToken>{},
  <vscode.CompletionContext>{}
);

function test_js_markdown() {
  Logger.info("Get title: ", js_markdown_title(example_vs_context));
}

export { test_js_markdown };
