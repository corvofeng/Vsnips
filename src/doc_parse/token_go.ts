import { FuncToken, FuncArg } from "./token_obj";
import { trim } from "../util";

class GoFuncToken extends FuncToken {
  static constructArgFromTokens(tokens: Array<string>): Array<FuncArg> {
    let argList: Array<FuncArg> = [];
    tokens.forEach(tok => {
      const [argName, argType] = trim(tok, [" "]).split(" ");
      argList.push(new FuncArg(argName, argType, ""));
    });

    return argList;
  }

  static constructRetFromTokens(tokens: Array<string>): Array<FuncArg> {
    let argList: Array<FuncArg> = [];
    tokens.forEach(tok => {
      let ret = trim(tok, [" ", "\n"]).split(" ");
      if (ret.length === 1) {
        argList.push(new FuncArg("", ret[0], ""));
      } else if (ret.length === 2) {
        argList.push(new FuncArg(ret[0], ret[1], ""));
      }
    });
    return argList;
  }
  getSnip(style: number) {
    let doc = "";
    // this.funcName
    // eslint-disable-next-line
    doc += `// ${this.funcName} \$\{TODO\}` + "\n";
    doc += "/*" + "\n";
    this.funcArgs.forEach(arg => {
      doc += FuncToken.format_arg(arg, style, " * ") + "\n";
    });
    doc += " */";
    return doc;
  }
}

export { GoFuncToken };
