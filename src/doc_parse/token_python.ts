import { ClassToken, FuncToken, FuncArg } from "./token_obj";



class PyClassToken extends ClassToken {}


class PyFuncToken extends FuncToken {
  /**
   * 根据tokens构建参数列表
   * @param tokens
   */
  static constructArgFromTokens(tokens: Array<string>): Array<FuncArg> {
    let argList: Array<FuncArg> = [];
    tokens.forEach(tok => {
      const tokPattern = /^(\**\w+)(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?/;
      let [, argName, argType, argDefault] = tokPattern.exec(
        tok
      ) as RegExpExecArray;

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
      doc += FuncToken.format_arg(arg, style) + "\n";
    });
    doc += FuncToken.format_return(style);
    return doc;
  }
}

export { PyFuncToken, PyClassToken };
