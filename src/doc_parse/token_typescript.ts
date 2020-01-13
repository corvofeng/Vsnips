import { FuncToken, FuncArg } from "./token_obj";

class TsFuncToken extends FuncToken {
  /**
   * 根据tokens构建参数列表
   * @param tokens
   */
  static constructArgFromTokens(tokens: Array<string>): Array<FuncArg> {
    let argList: Array<FuncArg> = [];
    tokens.forEach(tok => {
      const tokPattern = /^((?:\.\.\.)?\w+\??)(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?/;
      let [, argName, argType, argDefault] = tokPattern.exec(
        tok
      ) as RegExpExecArray;

      if (argName.startsWith("...")) {
        // 以'...'开头的参数, 说明是不定参数
        if (argType === undefined) {
          // 如果TS中没有指定argType, 我们给定一个
          argType = "object[]";
        }
        argName = argName.substr(3);
      }

      argList.push(new FuncArg(argName, argType, argDefault));
    });
    return argList;
  }

  getSnip(style: number) {
    let doc = "";
    this.funcArgs.forEach(arg => {
      if (arg.argName === "self") {
        return;
      }
      doc += FuncToken.format_arg(arg, style, " * ") + "\n";
    });
    doc += FuncToken.format_return(style, " * ");
    return doc;
  }
}
export { TsFuncToken };
