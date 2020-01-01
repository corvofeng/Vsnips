import { Logger } from "./logger";
import { VSnipContext } from "./vsnip_context";
import * as ScriptFunc from "./script_tpl";
import UNSNIPS_ULTISNIPS from "@unisnips/ultisnips";
import { SnippetDefinition, applyReplacements, PlaceholderReplacement, ParseOptions } from "@unisnips/core";

class Snippet {
  prefix: string;
  body: string;
  descriptsion: string;

  definition!: SnippetDefinition;

  // 标记snip中是否有js函数, 如果有js占位函数的, 需要在补全时再进行一次求值操作
  // 将body体中的js函数进行求值处理.
  hasJSScript: boolean;

  constructor() {
    this.prefix = "";
    this.body = "";
    this.descriptsion = "";
    this.hasJSScript = false;
  }

  get_snip_body(vsContext: VSnipContext) {
    let rlt = "";
    if (this.hasJSScript) {
      rlt = jsFuncEval(this.body, vsContext);
    } else {
      rlt = this.body;
    }
    return rlt;
  }
}

function parse(rawSnippets: string, opts: ParseOptions = {}): Array<Snippet> {
  let snips: Array<Snippet> = [];
  const { definitions } = UNSNIPS_ULTISNIPS.parse(rawSnippets, opts);
  definitions.forEach(def => {
    const snip = new Snippet();
    snips.push(snip);
    snip.definition = def;
    snip.prefix = def.trigger;
    snip.body = def.body;
    snip.descriptsion = def.description;
    replacePlaceholderScript(snip);

    Logger.debug("prefix: ", snip.prefix);
    Logger.debug("description: ", snip.descriptsion);
    Logger.debug("body: ", snip.body);
  });
  return snips;
}

// 这部分代码用于实现从vim 或是 python函数 => js函数的转换
// 主要应用了正则替换.
function replacePlaceholderScript(snip: Snippet) {
  // 记录需要替换的值, 最后统一替换, 这里一定要注意, 不要exec之后马上替换,
  // js的实现有问题, 直接替换会导致之后的匹配出现问题, 需要等到所有待替换的值
  // 全部找出后再一起替换.
  const replacements: PlaceholderReplacement[] = [];

  snip.definition.placeholders.forEach(placeholder => {
    if (placeholder.valueType === "script") {
      let replacement: PlaceholderReplacement | null = null;
      const { scriptInfo } = placeholder;
      if (scriptInfo) {
        if (scriptInfo.scriptType === "js") {
          snip.hasJSScript = true;
        } else if (scriptInfo.scriptType === "python") {
          replacement = {
            placeholder,
            type: "string",
            replaceContent: pythonRewrite(scriptInfo.code)
          };
        } else if (scriptInfo.scriptType === "vim") {
          replacement = {
            placeholder,
            type: "string",
            replaceContent: vimRewrite(scriptInfo.code)
          };
        }
      }
      if (replacement) {
        replacements.push(replacement);
      }
    }
  });

  snip.body = applyReplacements(snip.definition, replacements);
}

function pythonRewrite(stmt: string) {
  // 用于处理这一类字符串: `!p snip.rv = get_quoting_style(snip)`
  Logger.debug("Wanna rewrite python", stmt);

  let func_name_pattern = /(\w+)\(snip\)/;

  if (func_name_pattern.test(stmt)) {
    let [_, func_name] = func_name_pattern.exec(stmt) as RegExpExecArray;
    Logger.debug("Get func name", func_name);
    let func = ScriptFunc.getTemplateFunc(func_name);
    if (func === undefined) {
      Logger.warn("Can't get function", func_name, "please check");
      return "";
    }

    try {
      return func();
    } catch (e) {
      Logger.error("In python func:", func_name, ", has error", e);
      return "";
    }
  }

  return stmt;
}

function vimRewrite(stmt: string) {
  // 用于处理这一类字符串: `!v g:snips_author`
  Logger.debug("Wanna rewrite vim", stmt);

  // 匹配时间打印函数
  let time_func_pattern = /strftime\("(.+)"\)/;
  let variable_pattern = /g:(\w*)/;

  if (time_func_pattern.test(stmt)) {
    let [_, time_fmt] = time_func_pattern.exec(stmt) as RegExpExecArray;
    Logger.debug("Get time fmt", time_fmt);
    // Please refer to:
    //   https://code.visualstudio.com/docs/editor/userdefinedsnippets#_variables
    let replace_table = [
      ["%Y", "$CURRENT_YEAR"],
      ["%B", "$CURRENT_MONTH_NAME"],
      ["%b", "$CURRENT_MONTH_NAME_SHORT"],
      ["%m", "$CURRENT_MONTH"],
      ["%d", "$CURRENT_DATE"],
      ["%H", "$CURRENT_HOUR"],
      ["%M", "$CURRENT_MINUTE"],
      ["%S", "$CURRENT_SECOND"]
    ];
    replace_table.forEach(time_func => {
      let [vim_time_func, vscode_time_func] = time_func;
      time_fmt = time_fmt.replace(vim_time_func, vscode_time_func);
    });
    stmt = time_fmt;
  } else if (variable_pattern.test(stmt)) {
    let [_, variable_name] = variable_pattern.exec(stmt) as RegExpExecArray;
    Logger.debug("Get var", variable_name);
    stmt = ScriptFunc.getVimVar(variable_name);
  }

  return stmt;
}

// 获得snip中的js函数, 并调用该函数名对应的函数指针.
function jsFuncEval(snip: string, vsContext: VSnipContext) {
  Logger.info("In js Func eval");

  let res = null;
  const JS_SNIP_FUNC_PATTERN = /`!js (\w+)\`/g;
  while ((res = JS_SNIP_FUNC_PATTERN.exec(snip)) !== null) {
    let [pattern, func_name] = res as RegExpExecArray;
    Logger.info("Get js func", pattern, func_name);
    // let func = (ScriptFunc as any)[func_name as string];
    let func = ScriptFunc.getTemplateFunc(func_name);
    if (func === null) {
      Logger.warn("Can't get js function", func_name, "please check");
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

export { parse };
