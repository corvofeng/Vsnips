"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename: vsnip_watcher
 *
 *     Version: 1.0
 *  Created on: January 11, 2020
 *
 *      Author: corvo
 *=======================================================================
 */


import * as vscode from "vscode";


// 是否与VSCode的编辑器进行交互
// 参考学习了:
//   https://github.com/draivin/hsnips/blob/master/src/hsnippet.ts
abstract class VSnipWatcher {
    protected editor: vscode.TextEditor;

    public constructor(editor: vscode.TextEditor) {
        this.editor = editor;
    }

    // VSCode的修改事件会由此函数进行通知(此对象中的rangeOffset与rangeLength我没有看懂)
    // 所以把能与想到的情况在这里列一下:
    // 
    // 1. 插入一个字符
    //      [{"range":[{"line":33,"character":5},{"line":33,"character":5}, "text":"x"], 
    //      range中的起止位置一致, 为插入位置, text为插入字符
    // 
    // 2. 删除一个字符
    //      [{"range":[{"line":33,"character":5},{"line":33,"character":6}],"rangeOffset":630,"rangeLength":1,"text":""}]
    //      range中的起始位置为5, 结束位置为6, rangeLength为1, 且text为空
    // 
    // 3. 插入多个字符(复制的字符串)
    //      [{"range":[{"line":33,"character":5},{"line":33,"character":5}],"rangeOffset":630,"rangeLength":0,"text":"Word boundary"}]
    //      range中起止位置一致, 为插入位置, text为插入字符
    // 
    // 4. 删除多个字符
    //      [{"range":[{"line":33,"character":11},{"line":33,"character":15}],"rangeOffset":636,"rangeLength":4,"text":""}]
    //       range中起始位置为11, 结束位置15, rangeLength为1, 且text为空
    // 
    // 5. 多行增加字符(Shift+Alt+Arrow指定, 或是进入多行模式)
    //      [
    //          {"range":[{"line":33,"character":8},{"line":33,"character":9}],"rangeOffset":633,"rangeLength":1,"text":"t"},
    //          {"range":[{"line":34,"character":7},{"line":34,"character":8}],"rangeOffset":650,"rangeLength":1,"text":"t"}
    //      ]
    //      可以看到这里的起止位置均差1, rangeLength为1, text为插入的内容
    // 
    // 6. 多行删除字符
    //      [
    //        {"range":[{"line":33,"character":6},{"line":33,"character":7}],"rangeOffset":631,"rangeLength":1,"text":""},
    //        {"range":[{"line":34,"character":9},{"line":34,"character":10}],"rangeOffset":652,"rangeLength":1,"text":""}
    //      ]
    //     起止均相差1, rangeLength为1, text为空
    // 
    // 7. 替换一个或多个字符
    //      [{"range":[{"line":33,"character":6},{"line":33,"character":9}],"rangeOffset":631,"rangeLength":3,"text":"x"}]
    //      起止为原始内容的起止点, rangeLength为原始内容的长度, text为新内容.
    // 
    // 总结:
    //  通过上面的内容可以看出, range的行为和我们要做的操作有一些不太明显的联系. 我简单总结下几点
    //      text=="" rangeLength!=0 说明为删除操作, 起止点为range包含的内容.
    //      
    //      text!="" 说明为插入或是替换操作, range[0]为插入或是替换的位置
    abstract onUpdate(changes: readonly vscode.TextDocumentContentChangeEvent[]): void;

    getEditor(): vscode.TextEditor {
        return this.editor;
    }

    // onRegister(context: vscode.ExtensionContext): void;
    // onDeRegister(context: vscode.ExtensionContext): void;
}
let VSnipWatcherArray: Array<VSnipWatcher> = [];


export { VSnipWatcher, VSnipWatcherArray };


