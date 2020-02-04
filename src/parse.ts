import { Logger } from "./logger";
import { VSnipContext } from "./vsnip_context";
import * as ScriptFunc from "./script_tpl";
import { trim } from "./util";
// import * as vscode from "vscode";

const VIM_SNIPPET = /^snippet ([^\s]*)\s*(?:"(.*?)"(.*))?\n((?:.|\n)*?)\nendsnippet$/gm;

class Snippet {
  // Please refer to: https://github.com/SirVer/ultisnips/blob/master/doc/UltiSnips.txt
  public prefix: string;
  public body: string;
  public descriptsion: string;
  public vimOptions: string;

  // 标记snip中是否有js函数, 如果有js占位函数的, 需要在补全时再进行一次求值操作
  // 将body体中的js函数进行求值处理.
  public hasJSScript: boolean;

  constructor(prefix="",  description="",  options="", body="", hasJSScript=false,) {
    this.prefix = prefix;
    this.body = body;
    this.descriptsion = description;
    this.hasJSScript = hasJSScript;
    this.vimOptions = options;

    Logger.debug(`prefix:  "${this.prefix}"`);
    Logger.debug(`description: "${this.descriptsion}"`);
    Logger.debug(`options: "${this.vimOptions}"`);
    Logger.debug("body: ", this.body);
    Logger.debug("hasJSScript: ", this.hasJSScript);
  }

  public get_snip_body(vsContext: VSnipContext) {
    // if(this.options.includes('w')) {
    //   console.log("Get txt", vsContext.getTextByShift(-1));
    //   if(!vsContext.getTextByShift(-1).includes(this.prefix)) {
    //     Logger.warn("The ", this.prefix, "must have all prefix");
    //     return '';
    //   }
    // }
    let rlt = "";
    if (this.hasJSScript) {
      rlt = jsFuncEval(this.body, vsContext);
    } else {
      rlt = this.body;
    }
    Logger.debug("Get snippet", rlt);
    return rlt;
  }
}

function parse(rawSnippets: string): Snippet[] {
  let res = null;
  const snips: Snippet[] = [];
  Logger.debug("start parse", rawSnippets);
  while ((res = VIM_SNIPPET.exec(rawSnippets)) !== null) {
    const [, prefix, description, options, body] = res;

    const _prefix = prefix;
    const _b = normalizePlaceholders(body);
    const _options = trim(options, [" "]);
    const [_body, _hasJSScript] = lexParser(_b);
    const _descriptsion  = description;

    const snip = new Snippet(
      _prefix,
      _descriptsion,
      _options,
      _body,
      _hasJSScript,
    );

    snips.push(snip);
  }
  return snips;
}

// 这部分代码用于实现从vim 或是 python函数 => js函数的转换
// 主要应用了正则替换.
function lexParser(str: string): [string, boolean] {
  // 检查所有(``)包裹的部分, 并确保里面没有嵌套(`)
  // 不允许多行包含多行
  // eslint-disable-next-line
  const SNIP_FUNC_PATTERN = /`([^\`]+)\`/g;

  const FT_UNKNOW = 0x0;
  const FT_VIM = 0x1;
  const FT_PYTHON = 0x2;
  const FT_JAVASCRIPT = 0x3;

  Logger.debug("Before parse", str);
  let rlt = "";
  let hasJSScript = false;

  // 记录需要替换的值, 最后统一替换, 这里一定要注意, 不要exec之后马上替换,
  // js的实现有问题, 直接替换会导致之后的匹配出现问题, 需要等到所有待替换的值
  // 全部找出后再一起替换.
  let res = null;
  const replaceMap = new Map();

  while ((res = SNIP_FUNC_PATTERN.exec(str)) !== null) {
    const [stmt, func] = res as RegExpExecArray;
    Logger.debug("Get parser", stmt);
    if (replaceMap.get(stmt)) {
      Logger.debug(`Already get ${stmt}.`);
      continue;
    }

    let funcType = FT_PYTHON;
    if (func.startsWith("!p")) {
      funcType = FT_PYTHON;
    } else if (func.startsWith("!v")) {
      funcType = FT_VIM;
    } else if (func.startsWith("!js")) {
      // TODO: make my own func
      funcType = FT_JAVASCRIPT;
      hasJSScript = true;
    } else {
      funcType = FT_UNKNOW;
    }

    switch (funcType) {
      case FT_PYTHON:
        rlt = pythonRewrite(func);
        replaceMap.set(stmt, rlt);
        break;
      case FT_VIM:
        rlt = vimRewrite(func);
        replaceMap.set(stmt, rlt);
        break;
      case FT_JAVASCRIPT:
        break;

      default:
        break;
    }

    Logger.debug("After replace stmt", stmt, "we got: ", str);
  }

  // string.replace函数调用一次只能替换一个, 需要全部替换
  // Copy from: https://stackoverflow.com/a/55698996
  function replaceAll(text: string, busca: string, reemplaza: string) {
    while (text.toString().indexOf(busca) !== -1) {
      text = text.toString().replace(busca, reemplaza);
    }
    return text;
  }
  replaceMap.forEach((rlt, stmt) => {
    if (rlt.startsWith(`\`!js`)) {
      hasJSScript = true;
    }
    str = replaceAll(str, stmt, rlt);
  });

  return [str, hasJSScript];
}

function pythonRewrite(stmt: string) {
  // 用于处理这一类字符串: `!p snip.rv = get_quoting_style(snip)`
  Logger.debug("Wanna rewrite python", stmt);

  const funcNamePattern = /(\w+)\(snip\)/;

  if (funcNamePattern.test(stmt)) {
    const [, funcName] = funcNamePattern.exec(stmt) as RegExpExecArray;
    Logger.debug("Get func name", funcName);
    const func = ScriptFunc.getTemplateFunc(funcName);
    if (func === undefined) {
      Logger.warn("Can't get function", funcName, "please check");
      return "";
    }

    try {
      return func();
    } catch (e) {
      Logger.error("In python func:", funcName, ", has error", e);
      return "";
    }
  }

  return stmt;
}

function vimRewrite(stmt: string) {
  // 用于处理这一类字符串: `!v g:snips_author`
  Logger.debug("Wanna rewrite vim", stmt);

  // 匹配时间打印函数
  const timeFuncPattern = /strftime\("(.+)"\)/;
  const variablePattern = /g:(\w*)/;
  const expandPattern = /expand\(['"](.+)['"]\)/;

  if (timeFuncPattern.test(stmt)) {
    const [, tFmt] = timeFuncPattern.exec(stmt) as RegExpExecArray;
    let timeFmt = tFmt;
    Logger.debug("Get time fmt", timeFmt);
    // Please refer to:
    //   https://code.visualstudio.com/docs/editor/userdefinedsnippets#_variables
    const replaceTable = [
      ["%Y", "$CURRENT_YEAR"],
      ["%B", "$CURRENT_MONTH_NAME"],
      ["%b", "$CURRENT_MONTH_NAME_SHORT"],
      ["%m", "$CURRENT_MONTH"],
      ["%d", "$CURRENT_DATE"],
      ["%H", "$CURRENT_HOUR"],
      ["%M", "$CURRENT_MINUTE"],
      ["%S", "$CURRENT_SECOND"],
    ];
    replaceTable.forEach((timeFunc) => {
      const [vimTimeFunc, vscodeTimeFunc] = timeFunc;
      timeFmt = timeFmt.replace(vimTimeFunc, vscodeTimeFunc);
    });
    stmt = timeFmt;
  } else if (variablePattern.test(stmt)) {
    const [, variableName] = variablePattern.exec(stmt) as RegExpExecArray;
    Logger.debug("Get var", variableName);
    stmt = ScriptFunc.getVimVar(variableName);
  } else if (expandPattern.test(stmt)) {
    const [, expandExpr] = expandPattern.exec(stmt) as RegExpExecArray;
    Logger.info("Get expand expr", expandExpr);
  } else {
    Logger.warn("Can't parse", stmt);
  }

  return stmt;
}

function normalizePlaceholders(str: string) {
  const visualPlaceholder = /\${(\d):\${VISUAL}}/;
  if (visualPlaceholder.test(str)) {
    const data = visualPlaceholder.exec(str) as RegExpExecArray;
    const n = data[1];
    Logger.debug("Get visual data", data, n);
    return str.replace(visualPlaceholder, `$${n}`);
  } else {
    return str;
  }
}

// 获得snip中的js函数, 并调用该函数名对应的函数指针.
function jsFuncEval(snip: string, vsContext: VSnipContext) {
  Logger.info("In js Func eval");

  let res = null;
  // eslint-disable-next-line
  const JS_SNIP_FUNC_PATTERN = /`!js (\w+)\`/g;

  while ((res = JS_SNIP_FUNC_PATTERN.exec(snip)) !== null) {
    const [pattern, funcName] = res as RegExpExecArray;
    Logger.info("Get js func", pattern, funcName);
    // let func = (ScriptFunc as any)[func_name as string];
    const func = ScriptFunc.getTemplateFunc(funcName);
    if (func === null) {
      Logger.warn("Can't get js function", funcName, "please check");
      return snip;
    }
    let funcRlt = "";
    try {
      funcRlt = func(vsContext);
    } catch (e) {
      Logger.error("In js func", e);
      return snip;
    }
    snip = snip.replace(pattern, funcRlt);
  }
  return snip;
}

export { parse, Snippet };
