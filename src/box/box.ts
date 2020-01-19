import { VSnipWatcher } from "../vsnip_watcher";
import * as vscode from "vscode";
import { Logger } from "../logger";
import { VSnipContext } from "../vsnip_context";
import { trim } from "../utils";

class BoxWatcher extends VSnipWatcher {

    private box: Box;

    constructor(editor: vscode.TextEditor, box: Box) {
        super(editor);
        this.box = box;
    }

    onUpdate(changes: readonly vscode.TextDocumentContentChangeEvent[]): void {
        let ordChanges = [...changes];
        ordChanges.sort((a, b) => {
            if (a.range.end.isBefore(b.range.end)) return -1;
            else if (a.range.end.isEqual(b.range.end)) return 0;
            else return 1;
        });
        Logger.debug("Get update", ordChanges);
        ordChanges.forEach(chRange => {
            Logger.info(this.editor.document.getText(chRange.range));
        })
        this.editor.edit(edit => {

        });
        return;
    }

    init(vsContext: VSnipContext) {
        return this.box.initSnip(vsContext);
    }
}

class Box {
    /*
              prefix
                +
     leftUpPox  |  leftUp                               rightUP
              +-v-+------------------------------------+
              |   |                                    |
              |   |                                    |
              |   |                                    |
              |   |                                    |
              |   |                                    |
              |   |                                    |
              |   |                                    |
              +---+------------------------------------+
                  leftBottom                            rightBottom
                                                        rightBottomPos
    */

    // content data
    prefix: string;

    leftUp: string;
    leftBottom: string;
    rightUp: string;
    rightBottom: string;

    left: string;
    right: string;
    up: string;
    bottom: string;
    boxContents: string[];

    // box control config
    hasEnd: boolean;
    lineLimit: number;
    realLen: number;

    // vscode position, 左上角, 右下角, 从0列开始, 包含prefix
    leftUpPos: vscode.Position;
    rightBottomPos: vscode.Position;


    // ``rv = '┌' + '─'.repeat(t[0].length + 2) + '┐'``
    // │ $1 │
    // ``rv = '└' + '─'.repeat(t[0].length + 2) + '┘'``

    // From Left to right, up to bottom
    public constructor() {
        this.prefix = "";
        this.leftUp = '┌';
        this.left = '|'
        this.leftBottom = '└';

        this.up = '─';
        this.bottom = '─';

        this.rightUp = '┐';
        this.right = '|';
        this.rightBottom = '┘';

        //  是否为定长
        this.hasEnd = false;

        // 每行的长度限制
        this.lineLimit = 78;
        this.realLen = 0;

        this.boxContents = [];
        this.leftUpPos = new vscode.Position(0, 0);
        this.rightBottomPos = new vscode.Position(0, 0);
    }

    // 读取已经存在的box片段
    static readExists() {
        return new Box();
    }

    public initSnip(vsContext: VSnipContext) {

        // 找出前缀
        this.prefix = trim(vsContext.getTextByShift(-1), ['\n']);

        // 删除前缀, 因为之后会重新创建
        if (this.prefix !== "") {
            let e = vsContext.getActiveEditor();
            if (e !== undefined) {
                let startPos = new vscode.Position(vsContext.position.line, 0);
                let endPos = vsContext.position
                e.edit(e => {
                    e.delete(new vscode.Range(startPos, endPos));
                });
            }
        }

        this.boxContents.push(this.prefix + this.leftUp + this.up.repeat(2) + this.rightUp);
        this.boxContents.push(this.prefix + this.left + ' $1 ' + this.right);
        this.boxContents.push(this.prefix + this.leftBottom + this.bottom.repeat(2) + this.rightBottom);

        // 求出此时的leftUpPos以及rightBottomPos
        this.leftUpPos = new vscode.Position(
            vsContext.position.line,
            0,
        );
        this.rightBottomPos = new vscode.Position(
            vsContext.position.line + 2,
            this.boxContents[this.boxContents.length - 1].length - 1
        );

        Logger.debug("Create box with", this.leftUpPos, this.rightBottomPos)
        return this.boxContents.join('\n');
    }

    public render(vsContext: VSnipContext) {
        Logger.debug(vsContext.position)


    }

    // 此函数用作同步编辑器与本地所存内容
    // change的内容解析请查看`src/vsnip_watcher.ts`
    public doChange(ch: vscode.TextDocumentContentChangeEvent) {
        if (ch.range.start.line <= this.leftUpPos.line ||
            ch.range.end.line >= this.rightBottomPos.line) {
            // 此次修改不在box内部, 不做任何处理
            Logger.warn("Can't process change: ", ch)
            return;
        }
        let s = ch.range.start;
        let e = ch.range.end;
        if (ch.text === "") {
            if (ch.rangeLength != 0) {
                if (s.line != e.line) {
                    let newBoxContnts = [];
                    // 删除多行
                    newBoxContnts = this.boxContents.slice(0, s.line - this.leftUpPos.line)
                    newBoxContnts.push(
                        this.boxContents[s.line-this.leftUpPos.line].slice(0, s.character) +
                        this.boxContents[e.line-this.leftUpPos.line].slice(e.character)
                    );
                    newBoxContnts.concat(
                        this.boxContents.slice(e.line - this.leftUpPos.line)
                    );
                    this.boxContents = newBoxContnts;
                } else {  // 行内删除, 只修改当前行
                    let oldLine = this.boxContents[s.line - this.leftUpPos.line]
                    this.boxContents[s.line - this.leftUpPos.line] = oldLine.slice(0, s.character) + oldLine.slice(e.character);
                }
            } else {
                Logger.warn("Could find what changes does in:", ch);
            }
        } else { // ch.text != ""

        }
    }


    isInBox(): boolean {

        return true;
    }
}

export { BoxWatcher, Box };