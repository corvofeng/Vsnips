"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename:vsnip_context.ts
 *
 *     Version: 1.0
 *  Created on: July 20, 2019
 *
 *      Author: corvo
 *=======================================================================
 */

import * as vscode from "vscode";

// 记录当前补全时需要的上下文信息, 是针对vscode所给信息的一层封装
class VSnipContext {
  // Please refer to https://code.visualstudio.com/api/references/vscode-api#TextDocument
  document: vscode.TextDocument;

  // Please refer to https://code.visualstudio.com/api/references/vscode-api#Position
  position: vscode.Position;

  // Please refer to https://code.visualstudio.com/api/references/vscode-api#CancellationToken
  token?: vscode.CancellationToken | null;

  // please refer to https://code.visualstudio.com/api/references/vscode-api#CompletionContext
  context?: vscode.CompletionContext;

  constructor(
    document: vscode.TextDocument,
    position: vscode.Position,
    token?: vscode.CancellationToken | null,
    context?: vscode.CompletionContext
  ) {
    this.document = document;
    this.position = position;
    if (token) {
      this.token = token;
    }
    if (context) {
      this.context = context;
    }
  }

  getActiveEditor() {
    return vscode.window.activeTextEditor;
  }

  /**
   *
   * @param numberOfShift 获取当前行数向上或偏移n行的效果.
   */
  getTextByShift(numberOfShift: number) {
    const pos = this.position;
    let range = null;
    if (numberOfShift > 0) {
      range = new vscode.Range(
        new vscode.Position(pos.line + numberOfShift * -1, 0),
        new vscode.Position(pos.line, 0),
      );
    } else {
      range = new vscode.Range(
        new vscode.Position(pos.line, 0),
        new vscode.Position(pos.line + numberOfShift * -1, 0),
      );
    }

    return this.document.getText(range);
  }
}

export { VSnipContext };
