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

import { expect } from "chai";
import "mocha";
import { InitLogger } from "../../logger";
import { setLogLevel } from "../../kv_store";
import { Box } from "../../box/box";
import * as vscode from "vscode";

class MyEvent implements vscode.TextDocumentContentChangeEvent {
  public range: vscode.Range;
  public rangeOffset: number;
  public rangeLength: number;
  public text: string;

  constructor(range: vscode.Range, rangeOffset: number, rangeLength: number, text: string) {
    this.range = range;
    this.rangeOffset = rangeOffset;
    this.rangeLength = rangeLength;
    this.text = text;
  }
}

describe("Box change", () => {
  const simpleBox = new Box();
  beforeEach((done) => {
    setLogLevel("WARN");
    InitLogger();

    simpleBox.boxContents = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  my   │",
      "// │ world │",
      "// └───────┘",
    ];
    simpleBox.leftUpPos = new vscode.Position(0, 0);
    simpleBox.rightBottomPos = new vscode.Position(
      simpleBox.leftUpPos.line + simpleBox.boxContents.length - 1,
      simpleBox.boxContents[simpleBox.boxContents.length - 1].length - 1,
    );
    done();
  });

  it("Add a char", () => {
    // 末尾增加s
    const newContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  my   │",
      "// │ worlds │",
      "// └───────┘",
    ];
    const ch = new MyEvent(
      new vscode.Range(
        new vscode.Position(3, 10),
        new vscode.Position(3, 10),
      ),
      0,
      0,
      "s",
    );
    simpleBox.doChange(ch);
    expect(simpleBox.boxContents).deep.eq(newContent);
  });

  it("Del a char", () => {
    // 删除y
    const newContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  m   │",
      "// │ world │",
      "// └───────┘",
    ];
    const ch = new MyEvent(
      new vscode.Range(
        new vscode.Position(2, 7),
        new vscode.Position(2, 8),
      ),
      0,
      1,
      "",
    );

    simpleBox.doChange(ch);
    expect(simpleBox.boxContents).deep.eq(newContent);
  });

  it("Add new line", () => {
    const newContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  my   │",
      "// │ world",
      " │",
      "// └───────┘",
    ];
    const ch = new MyEvent(
      new vscode.Range(
        new vscode.Position(3, 10),
        new vscode.Position(3, 10),
      ),
      0,
      0,
      "\n",
    );
    simpleBox.doChange(ch);
    expect(simpleBox.boxContents).deep.eq(newContent);
  });

  it("Delte multiline", () => {
    // 删除o my wo
    const newContent = [
      "// ┌───────┐",
      "// │ hellrld │",
      "// └───────┘",
    ];

    const ch = new MyEvent(
      new vscode.Range(
        new vscode.Position(1, 9),
        new vscode.Position(3, 7),
      ),
      0,
      24,
      "",
    );
    simpleBox.doChange(ch);
    expect(simpleBox.boxContents).deep.eq(newContent);
  });

  it("Add multi line", () => {
    // 在my后面增加 "vsnips\nis\nbest"

    // {"range":[{"line":40,"character":8},{"line":40,"character":8}],"rangeOffset":706,"rangeLength":0,"}
    const newContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  myvsnips",
      "is",
      "best   │",
      "// │ world │",
      "// └───────┘",
    ];
    const ch = new MyEvent(
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

  it("Modify head line", () => {
    // 在box前面做修改

    const ch = new MyEvent(
      new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(0, 0),
      ),
      0,
      0,
      "\n",
    );
    simpleBox.doChange(ch);
    // console.log(simpleBox.boxContents);
    // expect(simpleBox.boxContents).deep.eq(newContent);
  });



  it("Test box without prefix", () => {
    const oldContent = [
      "┌──┐",
      "│  │",
      "└──┘",
    ];
    simpleBox.boxContents = oldContent;
    simpleBox.prefix = "";

    // 增加x
    const ch = new MyEvent(
      new vscode.Range(
        new vscode.Position(1, 2),
        new vscode.Position(1, 2),
      ),
      0,
      0,
      "x",
    );
    simpleBox.doChange(ch);

    const newContent = [
      "┌──┐",
      "│ x │",
      "└──┘",
    ];
    expect(newContent).deep.eq(simpleBox.boxContents);
  });
});

describe("Refect box", () => {
  const simpleBox = new Box();
  beforeEach((done) => {
    setLogLevel("WARN");
    InitLogger();

    simpleBox.boxContents = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  my   │",
      "// │ world │",
      "// └───────┘",
    ];
    simpleBox.prefix = "// ";
    simpleBox.leftUpPos = new vscode.Position(0, 0);
    simpleBox.rightBottomPos = new vscode.Position(
      simpleBox.leftUpPos.line + simpleBox.boxContents.length - 1,
      simpleBox.boxContents[simpleBox.boxContents.length - 1].length - 1,
    );
    done();
  });

  it("Simple add", () => {
    const newContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  m   │",
      "// │ world │",
      "// └───────┘",
    ];
    simpleBox.boxContents = newContent;
    simpleBox.refectorBox();

    const refectContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  m    │",
      "// │ world │",
      "// └───────┘",
    ];
    expect(simpleBox.boxContents).deep.eq(refectContent);
  });

  it("Simple del", () => {
    const newContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  m   │",
      "// │ world │",
      "// └───────┘",
    ];

    const refectContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  m    │",
      "// │ world │",
      "// └───────┘",
    ];

    simpleBox.boxContents = newContent;
    simpleBox.refectorBox();
    expect(simpleBox.boxContents).deep.eq(refectContent);
  });

  it("Not full line", () => {
    const newContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  myvsnips",
      "is",
      "best   │",
      "// │ world │",
      "// └───────┘",
    ];
    const refectContent = [
      "// ┌───────────┐",
      "// │ hello     │",
      "// │  myvsnips │",
      "// │is         │",
      "// │best       │",
      "// │ world     │",
      "// └───────────┘",
    ];
    simpleBox.boxContents = newContent;
    simpleBox.refectorBox();
    expect(simpleBox.boxContents).deep.eq(refectContent);
  });


  it("For large input", () => {
    const newContent = [
      "// ┌─────────────┐",
      "// │ helloxxx    │",
      "// │  mxxxxxxxxxxxx   │",
      "// │ world       │",
      "// └─────────────┘",
    ];

    const refectContent = [
      "// ┌────────────────┐",
      "// │ helloxxx       │",
      "// │  mxxxxxxxxxxxx │",
      "// │ world          │",
      "// └────────────────┘",
    ];

    simpleBox.boxContents = newContent;
    simpleBox.refectorBox();
    expect(simpleBox.boxContents).deep.eq(refectContent);
  });


  it("With no prefix", () => {
    const newContent = [
      "┌──┐",
      "│ x │",
      "└──┘",
    ];

    const refectContent = [
      "┌───┐",
      "│ x │",
      "└───┘",
    ];
    simpleBox.prefix = "";
    simpleBox.boxContents = newContent;
    simpleBox.refectorBox();
    expect(simpleBox.boxContents).deep.eq(refectContent);
  });
  it("Add new line", () => {
    const newContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  my   │",
      "// │ world",
      " │",
      "// └───────┘",
    ];
    const refectContent = [
      "// ┌───────┐",
      "// │ hello │",
      "// │  my   │",
      "// │ world │",
      "// │       │",
      "// └───────┘",
    ];
    simpleBox.boxContents = newContent;
    simpleBox.refectorBox();
    expect(simpleBox.boxContents).deep.eq(refectContent);
  });
});
