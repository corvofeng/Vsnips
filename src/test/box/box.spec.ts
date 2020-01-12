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
import * as vscode from "vscode";

class MyEvent implements vscode.TextDocumentContentChangeEvent {
  range: vscode.Range;
  rangeOffset: number;
  rangeLength: number;
  text: string

  constructor(range: vscode.Range, rangeOffset: number, rangeLength: number, text: string) {
    this.range = range;
    this.rangeOffset = rangeOffset;
    this.rangeLength = rangeLength;
    this.text = text;
  }
}

describe("Box change", () => {
  let simpleBox = new Box();
  beforeEach(function (done) {
    setLogLevel('DEBUG');
    InitLogger();

    simpleBox.boxContents = [
      "// ┌───────┐",
      "// | hello |",
      "// |  my   |",
      "// | world |",
      "// └───────┘",
    ];
    simpleBox.leftUpPos = new vscode.Position(0, 0);
    simpleBox.rightBottomPos = new vscode.Position(
      simpleBox.leftUpPos.line + simpleBox.boxContents.length - 1,
      simpleBox.boxContents[simpleBox.boxContents.length - 1].length - 1
    );
    done();
  });

  it('Add a char', () => {
    // 末尾增加s
    let newContent = [
      "// ┌───────┐",
      "// | hello |",
      "// |  my   |",
      "// | worlds |",
      "// └───────┘",
    ];
    let ch = new MyEvent(
      new vscode.Range(
        new vscode.Position(3, 10),
        new vscode.Position(3, 10),
      ),
      0,
      0,
      's',
    );
    simpleBox.doChange(ch);
    expect(simpleBox.boxContents).deep.eq(newContent);
  });

  it('Del a char', () => {
    // 删除y
    let newContent = [
      "// ┌───────┐",
      "// | hello |",
      "// |  m   |",
      "// | world |",
      "// └───────┘",
    ];
    let ch = new MyEvent(
      new vscode.Range(
        new vscode.Position(2, 7),
        new vscode.Position(2, 8),
      ),
      0,
      1,
      '',
    );

    simpleBox.doChange(ch);
    expect(simpleBox.boxContents).deep.eq(newContent);
  });

  it('Delte multiline', () => {
    // 删除o my wo
    let newContent = [
      "// ┌───────┐",
      "// | hellrld |",
      "// └───────┘",
    ];

    let ch = new MyEvent(
      new vscode.Range(
        new vscode.Position(1, 9),
        new vscode.Position(3, 7),
      ),
      0,
      24,
      '',
    );
    simpleBox.doChange(ch);
    expect(simpleBox.boxContents).deep.eq(newContent);
  });

  it('Add multi line', () => {
    // 在my后面增加 'vsnips\nis\nbest'

    // {"range":[{"line":40,"character":8},{"line":40,"character":8}],"rangeOffset":706,"rangeLength":0,"}
    let newContent = [
      "// ┌───────┐",
      "// | hello |",
      "// |  myvsnips",
      "is",
      "best   |",
      "// | world |",
      "// └───────┘",
    ];
    let ch = new MyEvent(
      new vscode.Range(
        new vscode.Position(2, 8),
        new vscode.Position(2, 8),
      ),
      0,
      0,
      "vsnips\nis\nbest",
    );
    simpleBox.doChange(ch);
    expect(simpleBox.boxContents).deep.eq(newContent);
  });
});

describe("Refect box", () => {
  let simpleBox = new Box();
  beforeEach(function (done) {
    setLogLevel('DEBUG');
    InitLogger();

    simpleBox.boxContents = [
      "// ┌───────┐",
      "// | hello |",
      "// |  my   |",
      "// | world |",
      "// └───────┘",
    ];
    simpleBox.prefix = '// ';
    simpleBox.leftUpPos = new vscode.Position(0, 0);
    simpleBox.rightBottomPos = new vscode.Position(
      simpleBox.leftUpPos.line + simpleBox.boxContents.length - 1,
      simpleBox.boxContents[simpleBox.boxContents.length - 1].length - 1
    );
    done();
  })

  it("Simple add", () => {
    let newContent = [
      "// ┌───────┐",
      "// | hello |",
      "// |  m   |",
      "// | world |",
      "// └───────┘"
    ];
    simpleBox.boxContents = newContent;
    simpleBox.refectorBox();

    let refectContent = [
      "// ┌───────┐",
      "// | hello |",
      "// |  m    |",
      "// | world |",
      "// └───────┘",
    ];
    expect(simpleBox.boxContents).deep.eq(refectContent);
  });

  it("Simple del", () => {
    let newContent = [
      "// ┌───────┐",
      "// | hello |",
      "// |  m   |",
      "// | world |",
      "// └───────┘",
    ];

    let refectContent = [
      "// ┌───────┐",
      "// | hello |",
      "// |  m    |",
      "// | world |",
      "// └───────┘",
    ];

    simpleBox.boxContents = newContent;
    simpleBox.refectorBox();
    expect(simpleBox.boxContents).deep.eq(refectContent);
  });

  it("Not full line", () => {
    let newContent = [
      "// ┌───────┐",
      "// | hello |",
      "// |  myvsnips",
      "is",
      "best   |",
      "// | world |",
      "// └───────┘",
    ];
    let refectContent = [
      "// ┌──────────┐",
      "// | hello    |",
      "// |  myvsnips|",
      "// |is        |",
      "// |best      |",
      "// | world    |",
      "// └──────────┘",
    ]
    simpleBox.boxContents = newContent;
    simpleBox.refectorBox();
    expect(simpleBox.boxContents).deep.eq(refectContent);
  })
});
