"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename:script_tpl.ts
 *
 *     Version: 1.0
 *  Created on: July 02, 2019
 *
 *      Author: corvo
 *=======================================================================
 */

import * as fs from "fs";
import { Logger } from "./logger";
import * as path from "path";
import { VSnipContext } from "./vsnip_context";
import { USER_MODULE, jsParser } from "./user_script";
import { getUserScriptFiles } from "./kv_store";
import { parseTokenizer } from "./doc_parse/tokenize";
import { BoxWatcher, Box } from "./box/box";
import { VSnipWatcherArray } from "./vsnip_watcher";
import { trim } from "./util";
import { Position, Range } from "vscode";
import { PyFuncToken } from "./doc_parse/token_python";
import { TsFuncToken } from "./doc_parse/token_typescript";
import { GoFuncToken } from "./doc_parse/token_go";

const BUILDIN_MODULE = new Map();

// For python.snippets
const  SINGLE_QUOTES = "'";
const  DOUBLE_QUOTES = "\"";

const  VIM_VARS_MAP: Map<string, string> = new Map();

/**
 * jsFuncDecorator将函数指针转换为字符串装载
 * 参数使用eval的主要原因是不想自己去处理转义字符带来的问题
 *
 * 参数为空, 直接返回装饰结果
 * 参数不为空, 返回一个可以被eval解析的参数列表
 *
 * 示例:
 *    参数: js_get_simple_box, []
 *    返回值: `js js_get_simple_box`
 *
 *    参数: js_get_simple_box ["arg1", "arg2", "arg3"]
 *    返回值: `!js js_get_simple_box ["arg1","arg2","arg3"]`
 */
function jsFuncDecorator(funcName: string, args: string[]=[]) {
  if (args.length == 0) {
    return `\`!js ${funcName}\``;
  } else {
    return `\`!js ${funcName} ["${args.join('","')}"]\``;
  }
}

function get_quoting_style() {
  const style = getVimVar("ultisnips_python_quoting_style", "double");
  if (style === "single") {
    return SINGLE_QUOTES;
  }

  return DOUBLE_QUOTES;
}

function triple_quotes() {
  const style = getVimVar("ultisnips_python_triple_quoting_style");
  if (!style) {
    return get_quoting_style().repeat(3);
  }
  if (style === "double") {
    return DOUBLE_QUOTES.repeat(3);
  } else {
    return SINGLE_QUOTES.repeat(3);
  }
}

function get_markdown_title() {
  return jsFuncDecorator("js_markdown_title");
}

function js_markdown_title(vsContext: VSnipContext) {
  const fn = vsContext.document.fileName;
  return path.basename(fn, path.extname(fn));
}

function get_python_doc_style() {
  const docStyle = getVimVar("ultisnips_python_style", "sphinx");
  Logger.debug("Get style: ", docStyle);
  let st = PyFuncToken.SPHINX;
  switch (docStyle) {
    case "sphinx":
      st = PyFuncToken.SPHINX;
      break;
    case "doxygen":
      st = PyFuncToken.DOXYGEN;
      break;
    case "google":
      st = PyFuncToken.GOOGLE;
      break;
    case "numpy":
      st = PyFuncToken.NUMPY;
      break;
    case "jedi":
      st = PyFuncToken.JEDI;
      break;
    default:
      Logger.warn(`The ${docStyle} not found`);
  }
  return st;
}

function js_python_doc(vsContext: VSnipContext) {
  Logger.debug("In js python doc:", vsContext);
  let rlt;
  for (let shift = 2; shift < 20; shift += 1) {
    rlt = parseTokenizer(vsContext.getTextByShift(shift), "python");
    if (rlt !== undefined) {
      break;
    }
  }

  Logger.debug("Get token: ", rlt);
  let snipData = "";
  if (rlt !== undefined) {
    snipData = rlt.getSnip(get_python_doc_style());
  }
  return triple_quotes() + "\n" +
    snipData + "\n" +
    triple_quotes();
}

function js_typescript_doc(vsContext: VSnipContext) {
  Logger.debug("In js typescript doc:", vsContext);
  let rlt;
  for (let shift = -1; shift > -20; shift -= 1) {
    rlt = parseTokenizer(vsContext.getTextByShift(shift), "typescript");
    if (rlt !== undefined) {
      break;
    }
  }
  Logger.debug("Get token", rlt);
  if (rlt !== undefined) {
    return "/**" + "\n" +
      rlt.getSnip(TsFuncToken.GOOGLE) + "\n" +
      " */";
  } else {
    return "";
  }
}

function js_go_doc(vsContext: VSnipContext) {
  Logger.debug("In golang typescript doc:", vsContext);
  let rlt;
  for (let shift = -1; shift > -20; shift -= 1) {
    rlt = parseTokenizer(vsContext.getTextByShift(shift), "golang");
    if (rlt !== undefined) {
      break;
    }
  }
  Logger.debug("Get token", rlt);
  if (rlt !== undefined) {
      // " */";
      return rlt.getSnip(GoFuncToken.GOOGLE);
  } else {
    return "";
  }
}

function get_python_doc() {
  return jsFuncDecorator("js_python_doc");
}
function get_typescript_doc() {
  return jsFuncDecorator("js_typescript_doc");
}
function get_go_doc() {
  return jsFuncDecorator("js_go_doc");
}

function get_simple_box() {
  return jsFuncDecorator("js_get_simple_box");
}

function js_get_simple_box(vsContext: VSnipContext) {
  const e = vsContext.getActiveEditor();
  if (e === undefined) {
    Logger.warn("Cant\" get active editor");
    return;
  }
  // 找出前缀
  let prefix = trim(vsContext.getTextByShift(-1), ["\n"]);
  if (prefix.endsWith("vbox")) {
    prefix = prefix.substring(0, prefix.length - 4);
  }
  Logger.info(`Get box prefix: "${prefix}"`);

  // 删除前缀, 因为之后会重新创建
  if (prefix !== "") {
    const editor = vsContext.getActiveEditor();
    if (editor !== undefined) {
      const startPos = new Position(vsContext.position.line, 0);
      const endPos = vsContext.position;
      editor.edit((te) => {
        te.delete(new Range(startPos, endPos));
      });
    }
  }

  const boxWatcher = new BoxWatcher(e, new Box((prefix)));
  const snip = boxWatcher.init(new Position(vsContext.position.line, 0));

  Logger.info("Register a new box watcher");

  // 注册监听事件
  VSnipWatcherArray.push(boxWatcher);
  return snip;
}

function var_parser(data: string) {
  // 只匹配let开头的语句, 并且要求只能是数字或是字符串
  // 数字可以不带引号, 字符串必须用单引号或是双引号包裹
  // eslint-disable-next-line
  const VIM_VARS_PATERN = /^let g:(\w+)\s*=\s*(\d*|"[^\"]*"|"[^\"]*")?(?:\s*\"[^\"]*)?$/gm;
  let res = null;

  while ((res = VIM_VARS_PATERN.exec(data)) !== null) {
    const [, key, value] = res as RegExpExecArray;
    // Logger.debug(key, value, res);
    // 正则表达式中的value带有"或是", 需要去掉
    VIM_VARS_MAP.set(key, value.replace(/[""]+/g, ""));
  }
}

// 读取给定文件中的vim变量
function initVimVar(varFiles: string[]) {
  varFiles.forEach((file) => {
    Logger.debug("Get file", file);
    try {
      const data = fs.readFileSync(file, "utf8");
      var_parser(data);
    } catch (error) {
      Logger.error("Can\"t parse the var file: ", file);
    }
  });
}

function initVSCodeVar(vscodeVars: Map<string, string>) {
  Logger.info(VIM_VARS_MAP);
  vscodeVars.forEach((varValue: string, varKey: string) => {
    Logger.debug("Get VSCode var key:", varKey, "var value:", varValue);
    VIM_VARS_MAP.set(varKey, varValue);
  });
}

// 通过变量名获取vim中的变量
function getVimVar(name: string, defaultValue: string = "") {
  if (VIM_VARS_MAP === null) {
    Logger.warn("There is no varilables in map");
    return "";
  }

  return VIM_VARS_MAP.get(name) || defaultValue;
}

function clearVimVar() {
  VIM_VARS_MAP.clear();
}

function initTemplateFunc() {
  BUILDIN_MODULE.set("get_quoting_style", get_quoting_style);
  BUILDIN_MODULE.set("get_markdown_title", get_markdown_title);
  BUILDIN_MODULE.set("triple_quotes", triple_quotes);
  BUILDIN_MODULE.set("js_markdown_title", js_markdown_title);
  BUILDIN_MODULE.set("get_python_doc", get_python_doc);
  BUILDIN_MODULE.set("get_simple_box", get_simple_box);
  BUILDIN_MODULE.set("js_python_doc", js_python_doc);
  BUILDIN_MODULE.set("js_typescript_doc", js_typescript_doc);
  BUILDIN_MODULE.set("get_typescript_doc", get_typescript_doc);
  BUILDIN_MODULE.set("js_get_simple_box", js_get_simple_box);
  BUILDIN_MODULE.set("js_go_doc", js_go_doc);
  BUILDIN_MODULE.set("get_go_doc", get_go_doc);
  jsParser(getUserScriptFiles());
}

/**
 * 获取模板函数, 模板函数分为两部分:
 *  1. 在此文件中的部分函数
 *  2. 用户自定义函数
 */
function getTemplateFunc(name: string) {
  // 优先搜索此文件中定义的函数
  let func = BUILDIN_MODULE.get(name);
  if (func !== undefined) {
    return func;
  }

  Logger.info(`Can"t get func buildin: ${name}, query user module`);

  func = USER_MODULE.get(name);
  return func;
}

export {
  initVimVar,
  getVimVar,
  jsFuncDecorator,
  var_parser,
  initTemplateFunc,
  getTemplateFunc,
  initVSCodeVar,
  clearVimVar,
};
