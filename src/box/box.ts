import { VSnipWatcher, VSnipWatcherArray } from "../vsnip_watcher";
import * as vscode from "vscode";
import { Logger } from "../logger";
import { trimRight } from "../util";

class BoxWatcher extends VSnipWatcher {

  private box: Box;

  constructor(editor: vscode.TextEditor, box: Box) {
    super(editor);
    this.box = box;
  }

  onUpdate(changes: readonly vscode.TextDocumentContentChangeEvent[]): void {
    let ordChanges = [...changes];

    Logger.debug("Get update", ordChanges);
    if (this.box.blockChanged) { // 防止循环调用
      this.box.blockChanged = false;
      return;
    }

    let hasChange = false;
    ordChanges.forEach(ch => {
      Logger.debug(this.editor.document.getText(ch.range));
      let makeChange = this.box.doChange(ch);
      if (makeChange) {
        hasChange = true;
      }
    });

    if (hasChange) {
      this.box.refectorBox();
      // eslint-disable-next-line
      console.log(this.box.boxContents);

      this.editor.edit(edit => {
        this.box.render(edit);
        this.box.blockChanged = true;
      });
    }
    return;
  }

  init(leftUpPos: vscode.Position) {
    return this.box.initSnip(leftUpPos);
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
  blockChanged: boolean;


  // ``rv = '┌' + '─'.repeat(t[0].length + 2) + '┐'``
  // │ $1 │
  // ``rv = '└' + '─'.repeat(t[0].length + 2) + '┘'``

  // From Left to right, up to bottom
  public constructor(
    prefix = "",
    leftUp = '┌',
    left = '│',
    leftBottom = '└',

    up = '─',
    bottom = '─',

    rightUp = '┐',
    right = '│',
    rightBottom = '┘',
  ) {
    this.prefix = prefix;
    this.leftUp = leftUp;
    this.left = left;
    this.leftBottom = leftBottom;

    this.up = up;
    this.bottom = bottom;

    this.rightUp = rightUp;
    this.right = right;
    this.rightBottom = rightBottom;

    //  是否为定长
    this.hasEnd = false;

    // 每行的长度限制
    this.lineLimit = 78;
    this.realLen = 0;

    this.boxContents = [];
    this.leftUpPos = new vscode.Position(0, 0);
    this.rightBottomPos = new vscode.Position(0, 0);
    this.blockChanged = false;
  }

  // 读取已经存在的box片段
  static readExists() {
    // return new Box();
  }

  public initSnip(leftUpPos: vscode.Position) {

    // 实际保存的snip字符串不包括$1这种占位符
    let snipArr = [];
    this.boxContents.push(this.prefix + this.leftUp + this.up.repeat(2) + this.rightUp);
    snipArr.push(this.boxContents[0]);

    this.boxContents.push(this.prefix + this.left + '  ' + this.right);
    snipArr.push(this.prefix + this.left + ' $1 ' + this.right);

    this.boxContents.push(this.prefix + this.leftBottom + this.bottom.repeat(2) + this.rightBottom);
    snipArr.push(this.boxContents[2]);

    // 求出此时的leftUpPos以及rightBottomPos
    this.leftUpPos = leftUpPos;
    this.syncRightBottom();
    this.blockChanged = true;

    Logger.debug("Create box with", this.leftUpPos, this.rightBottomPos);
    return snipArr.join('\n');
  }

  public render(edit: vscode.TextEditorEdit) {
    // Logger.debug(vsContext.position)
    let pos = this.leftUpPos;

    this.boxContents.forEach((content, i) => {
      let range = new vscode.Range(
        new vscode.Position(pos.line + i, 0),
        new vscode.Position(pos.line + i, content.length + 1),
      );
      edit.replace(range, content);
    });
    this.syncRightBottom();
  }

  // 同步右下角的节点坐标
  public syncRightBottom() {
    this.rightBottomPos = new vscode.Position(
      this.leftUpPos.line + this.boxContents.length - 1,
      this.boxContents[this.boxContents.length - 1].length - 1
    );
  }

  // 此函数用作同步编辑器与本地所存内容
  // change的内容解析请查看`src/vsnip_watcher.ts`
  // 返回此次是否进行了修改
  public doChange(ch: vscode.TextDocumentContentChangeEvent): boolean {
    if (ch.range.start.isEqual(this.leftUpPos)) {
      Logger.info("Modify the head pos");

      this.syncRightBottom();
      return false;
    }
    if (ch.range.start.line < this.leftUpPos.line ||
      ch.range.end.line >= this.rightBottomPos.line) {
      // 此次修改不在box内部, 不做任何处理
      Logger.warn("Can't process change outside box:", ch, this.leftUpPos, this.rightBottomPos);
      // 同时也表明此次修改完成, 移除监听
      VSnipWatcherArray.shift();
      Logger.info("remove current watcher");
      return false;
    }
    let s = ch.range.start;
    let e = ch.range.end;

    // Issue-#24: fix the chinese box input.
    if (s.line == e.line && e.character - s.character + 1 == ch.text.length && ch.text.length > 1) {
      Logger.debug("This is input method events(IME)");
      return false;
    }

    if (ch.text === "") {
      if (ch.rangeLength !== 0) {
        if (s.line !== e.line) {
          let newBoxContnts = [];
          // 删除多行
          newBoxContnts = this.boxContents.slice(0, s.line - this.leftUpPos.line);
          newBoxContnts.push(
            this.boxContents[s.line - this.leftUpPos.line].slice(0, s.character) +
            this.boxContents[e.line - this.leftUpPos.line].slice(e.character)
          );
          newBoxContnts = newBoxContnts.concat(
            this.boxContents.slice(e.line - this.leftUpPos.line + 1)
          );
          this.boxContents = newBoxContnts;
        } else {  // 行内删除, 只修改当前行
          let oldLine = this.boxContents[s.line - this.leftUpPos.line];
          this.boxContents[s.line - this.leftUpPos.line] = oldLine.slice(0, s.character) + oldLine.slice(e.character);
        }
      } else {
        Logger.warn("Could find what changes does in:", ch);
      }
    } else { // ch.text != ""
      let arr = ch.text.split('\n');

      // 插入行的左右两侧字符串
      let lineLeft = this.boxContents[s.line - this.leftUpPos.line].slice(0, s.character);
      let lineRight = this.boxContents[s.line - this.leftUpPos.line].slice(s.character);

      if (arr.length === 1) {
        this.boxContents[s.line - this.leftUpPos.line] = lineLeft + arr[0] + lineRight;
      } else {
        let newBoxContnts = [];
        newBoxContnts = this.boxContents.slice(0, s.line - this.leftUpPos.line);
        newBoxContnts = newBoxContnts.concat(lineLeft + arr[0]);

        arr[arr.length - 1] = arr[arr.length - 1] + lineRight;
        for (let i = 1; i < arr.length; i++) {
          newBoxContnts = newBoxContnts.concat(arr[i]);
        }

        newBoxContnts = newBoxContnts.concat(
          this.boxContents.slice(
            s.line - this.leftUpPos.line + 1
          )
        );
        this.boxContents = newBoxContnts;
      }
    }
    return true;
  }

  // 整理文本内容修改后的box样式, 因为简单的增加删除文本会导致box样式被破坏.
  public refectorBox() {
    // 计算最长一行的长度, 以第一行为初始值
    let maxLen = this.boxContents[0].length;
    for (let i = 1; i < this.boxContents.length - 1; i++) { // 注意, 首尾行是不计算的
      // 如果行首没有前缀字符, 则直接进行增加
      if (!this.boxContents[i].startsWith(this.prefix + this.left)) {
        this.boxContents[i] = this.prefix + this.left + this.boxContents[i];
      }

      // 删除行末的right字符以及' '(如果原来没有前缀字符则不进行删除)
      if (this.boxContents[i] !== this.prefix + this.left) {
        // 必须要分步删除, 只能删除一个右侧字符
        this.boxContents[i] = trimRight(this.boxContents[i], [this.right]);
        this.boxContents[i] = trimRight(this.boxContents[i], [' ']);
      }

      // 为增加一个空格 以及右侧字符 的长度
      if (this.boxContents[i].length + this.right.length + 1 > maxLen) {
        maxLen = this.boxContents[i].length + this.right.length + 1;
      }
    }

    if (maxLen > this.lineLimit) {
      Logger.warn(`Current line(${maxLen}) is larger than ${this.lineLimit}`);
    }

    let contentLen = maxLen - this.prefix.length - this.left.length - this.right.length;

    // 开始构建新的内容
    let newContents = [];
    // 添加首行
    newContents.push(`${this.prefix}${this.leftUp}${this.up.repeat(contentLen)}${this.rightUp}`);
    for (let i = 1; i < this.boxContents.length - 1; i++) {
      let content = this.boxContents[i];
      newContents.push(
        content + ' '.repeat(contentLen - content.length + this.prefix.length + this.left.length) + this.right
      );
    }
    // 添加末行
    newContents.push(this.prefix + this.leftBottom + this.bottom.repeat(contentLen) + this.rightBottom);
    this.boxContents = newContents;
  }

  isInBox(): boolean {

    return true;
  }
}

export { BoxWatcher, Box };