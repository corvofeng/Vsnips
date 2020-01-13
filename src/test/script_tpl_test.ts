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
import { initTemplateFunc, getTemplateFunc } from "../script_tpl";
import { Logger } from "../logger";
import * as vscode from "vscode";

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
    lineCount: 1,
  } as vscode.TextDocument,
  {
    line: 0,
    character: 1,
  } as vscode.Position,
  {} as vscode.CancellationToken,
  {} as vscode.CompletionContext,
);

function test_js_markdown() {
  initTemplateFunc();
  const func = getTemplateFunc("js_markdown_title");
  Logger.info("Get title: ", func(ExampleVSCntext));
}

export { test_js_markdown };
