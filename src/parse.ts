import { Logger } from "./logger";
import { VSnipContext } from "./vsnip_context";
import * as ScriptFunc from "./script_tpl";
import { trim, replaceAll, argsToList, assertIsError } from "./util";
import * as vscode from "vscode";

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

  private isChanging: boolean;

  constructor(prefix="",  description="",  options="", body="", hasJSScript=false,) {
    this.prefix = prefix;
    this.body = body;
    this.descriptsion = description;
    this.hasJSScript = hasJSScript;
    this.vimOptions = options;
    this.isChanging = false;

    Logger.debug(`prefix:  "${this.prefix}"`);
    Logger.debug(`description: "${this.descriptsion}"`);
    Logger.debug(`options: "${this.vimOptions}"`);
    Logger.debug("body: ", this.body);
    Logger.debug("hasJSScript: ", this.hasJSScript);
  }
  public isAutoTriggered() {
    return this.vimOptions.includes("A");
  }
  public isWordBoundary() {
    return this.vimOptions.includes("w");
  }

  // i   In-word expansion - By default a snippet is expanded only if the tab
  //   trigger is the first word on the line or is preceded by one or more
  //   whitespace characters. A snippet with this option is expanded
  //   regardless of the preceding character. In other words, the snippet can
  //   be triggered in the middle of a word.
  public isInWordExpansion() {
    return this.vimOptions.includes("i");
  }

  public get_snip_body(vsContext: VSnipContext) {
    let rlt = "";
    if (this.hasJSScript) {
      [rlt, ] = lexParser(this.body, vsContext);
    } else {
      rlt = this.body;
    }
    Logger.debug("Get snippet", rlt);
    return rlt;
  }

  /**
   * 获取由自动触发生成的snip, 不管你有没有看懂代码, 任何修改都建议重写一份
   * vsContext (VSnipContext): TODO
   * editor (vscode.TextEditor): TODO
   * Returns: TODO
   */
  public get_snip_in_auto_triggered(vsContext: VSnipContext, editor: vscode.TextEditor): boolean {
    if (this.isChanging) { // 防止出现修改死循环
      this.isChanging = false;
      return false;
    }
    Logger.debug("Start check", this.prefix, "Get currently context", vsContext);
    const curLine = trim(vsContext.getTextByShift(-1), ['\n']);
    Logger.debug("Get txt", curLine);
    if(this.isWordBoundary()) { // 必须完整出现字符串
      if(!curLine.includes(this.prefix)) {
        Logger.warn("The ", this.prefix, "must have all prefix");
        return false;
      }
      if(this.isInWordExpansion()) { // 必须出现在开头或是一行的中间, 且字符串后面有空格
        const offset = vsContext.position.character;
        if (curLine[offset + 1] !== " " && curLine.length > this.prefix.length) {
          Logger.warn("Can't make snip with options 'i'", curLine, this.prefix);
          return false;
        }
      }
    } else {
      // 这里直接返回的主要原因是防止有人误用'A'这一选项,
      // 有可能会导致vscode出现不可预知的问题.
      Logger.warn("The snip", this, "must with options 'w'");
      return false;
    }

    const rlt = this.get_snip_body(vsContext);
    if(rlt === "") { // 必须获取到对应的结果
      return false;
    }

    const pos = vsContext.position;
    const content = rlt;
    const range = new vscode.Range(
      new vscode.Position(pos.line, pos.character - this.prefix.length+1),
      new vscode.Position(pos.line, pos.character + 1),
    );
    Logger.debug("Start change range", range);

    editor.insertSnippet(new vscode.SnippetString(content), range, { undoStopBefore: false, undoStopAfter: false });
    this.isChanging = true;

    return true;
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
function lexParser(str: string, vsContext?: VSnipContext): [string, boolean] {
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
        if(vsContext) {
          rlt = jsFuncEval(func, vsContext);
          replaceMap.set(stmt, rlt);
        }
        break;

      default:
        break;
    }

    Logger.debug("After replace stmt", stmt, "we got: ", str);
  }

  replaceMap.forEach((rlt, stmt) => {
    if (rlt.startsWith(`\`!js`)) {
      hasJSScript = true;
    }
    str = replaceAll(str, stmt, rlt);
  });

  return [str, hasJSScript];
}

/**
 * .. version_changed: 2021-09-01 增加对形如`!p snip.rv=get_comment_format()[0]`结构的支持
 * stmt (string): TODO
 * Returns: TODO
 */
function pythonRewrite(stmt: string) {
  // 用于处理这一类字符串: `!p snip.rv = get_quoting_style(snip)`
  Logger.debug("Wanna rewrite python", stmt);

  const funcNamePattern = /(\w+)\(snip\)/;
  const funcWithArgsPattern = /(\w+)\(snip(,.*)\)/;
  const funcWithPostSelector= /(\w+)\((.*)\)\[(\d*)\]/; // !p snip.rv=get_comment_format()[0]
  let funcName:string, argListStr: string = "", postSelector: string = "";

  if (funcNamePattern.test(stmt)) {
    [, funcName] = funcNamePattern.exec(stmt) as RegExpExecArray;
    Logger.debug("Get func name", funcName);
  } else if (funcWithArgsPattern.test(stmt)) {
    [, funcName, argListStr] = funcWithArgsPattern.exec(stmt) as RegExpExecArray;
    Logger.debug("Get func name", funcName, "arg list", argListStr);
  } else if (funcWithPostSelector.test(stmt)) {
    [, funcName, argListStr, postSelector] = funcWithPostSelector.exec(stmt) as RegExpExecArray;
    Logger.debug("Get func name", funcName, "arg list", argListStr, "post selector", postSelector);
  } else {
    funcName = "UnknowFunc";
  }

  const func = ScriptFunc.getTemplateFunc(funcName);
  let result: string = stmt;

  if (func === undefined) {
    Logger.warn(`Can't get function for '${stmt}' please check.`);
    return result;
  }

  try {
    // eslint-disable-next-line
    result = func.apply(undefined, argsToList(argListStr));
    if(postSelector !== "") {
      let inner = result.slice(1, -1);
      if (!inner.endsWith(')')) { // 类似`js js_get_simple_box`, 需要补好末尾的括号
        inner = inner + '()';
      }
      result = `\`${inner}[${postSelector}]\``;
    }
  } catch (e: unknown) {
    assertIsError(e);
    Logger.error("In python func:", funcName, ", has error", e.message);
  }


  return result;
}

function vimRewrite(stmt: string) {
  // 用于处理这一类字符串: `!v g:snips_author`
  Logger.debug("Wanna rewrite vim", stmt);

  // 匹配时间打印函数
  const timeFuncPattern = /strftime\(['"](.+)['"]\)/;
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
      ["%y", "$CURRENT_YEAR_SHORT"],
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
    Logger.debug("Get expand expr", expandExpr);
    const func = ScriptFunc.getTemplateFunc('get_vim_expand');
    try {
      stmt = func(expandExpr);
    } catch (error) {
        Logger.error("Process vim expand", error);
    }
  } else {
    Logger.warn("Can't parse", stmt);
  }

  return stmt;
}

function normalizePlaceholders(str: string) {
  const visualPlaceholder = /\${(\d):\${VISUAL(?::(.*))?}}/gm;
  let res = null;
  const replaceMap = new Map();
  while ((res = visualPlaceholder.exec(str)) !== null) {
    const [data, number, default_value] = res;
    const n = number;
    let replaceTxt = "";
    if (default_value) {
      // str = `$${${n}:$${$$TM_SELECTED_TEXT:main()}}`;
      replaceTxt = `\${${n}:\${TM_SELECTED_TEXT:${default_value}}}`;
    } else {
      replaceTxt = `\${${n}:\${TM_SELECTED_TEXT}}`;
    }
    Logger.debug("Get visual data", data, replaceTxt);
    replaceMap.set(data, replaceTxt);
  }

  replaceMap.forEach((replaceTxt, data) => {
    str = replaceAll(str, data, replaceTxt);
  });

  return str;
}

// 获得snip中的js函数, 并调用该函数名对应的函数指针.
function jsFuncEval(snip: string, vsContext: VSnipContext) {
  Logger.debug("In js Func eval");

  // eslint-disable-next-line
  let res = null;
  let [pattern, funcName, funcArgs, postSelector] = "";
  let selector = null;
  const JS_SNIP_FUNC_PATTERN = /!js (\w+)(\(.*\))?/;
  const JS_SNIP_FUNC_PATTERN_WITH_SELECTOR = /!js (\w+)(\(.*\))?\[(\d*)\]/;

  if (JS_SNIP_FUNC_PATTERN_WITH_SELECTOR.test(snip)) {
    [pattern, funcName, funcArgs, postSelector] = JS_SNIP_FUNC_PATTERN_WITH_SELECTOR.exec(snip)as RegExpExecArray;
  }else if (JS_SNIP_FUNC_PATTERN.test(snip)) {
    [pattern, funcName, funcArgs] = JS_SNIP_FUNC_PATTERN.exec(snip) as RegExpExecArray;
  }
  if (pattern === "" || funcName === "") {
    return snip;
  }
  Logger.info("Get js func", pattern, funcName, funcArgs, postSelector);

  const func = ScriptFunc.getTemplateFunc(funcName);
  if (func === null) {
    Logger.warn(`Can't get js function ${funcName} please check`);
    return snip;
  }

  if (postSelector && !isNaN(parseInt(postSelector))) {
    selector = parseInt(postSelector);
  }
  if(funcArgs) {
    funcArgs = funcArgs.slice(1, -1); // 去掉开头与结尾的括号
  }

  let funcRlt = "";
  {
    const funcWithCtx = func.bind(undefined, vsContext); // 没有this且默认第一个参数为vsContext
    const stmt = `funcWithCtx(${funcArgs})`;
    Logger.debug("Get func", stmt, funcWithCtx);
    try {
      // eslint-disable-next-line
      funcRlt = eval(stmt);
      if (selector != null && Number.isInteger(selector)) {
        funcRlt = funcRlt[selector];
      }
    } catch (e) {
      assertIsError(e);
      Logger.error("In js func", e.message);
      return snip;
    }
  }
  snip = snip.replace(pattern, funcRlt);

  return snip;
}

export { parse, Snippet };
