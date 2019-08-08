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

let BUILDIN_MODULE = new Map();

let JS_FUNC_FMT = `!js`;

// For python.snippets
let SINGLE_QUOTES = "'";
let DOUBLE_QUOTES = '"';

let NORMAL = 0x1;
let DOXYGEN = 0x2;
let SPHINX = 0x3;
let GOOGLE = 0x4;
let NUMPY = 0x5;
let JEDI = 0x6;
let VIM_VARS_MAP: Map<string, string> = new Map();

// jsFuncDecorator 与jsFuncEval配合使用
// jsFuncDecorator将函数指针转换为字符串装载
function jsFuncDecorator(funcName: string) {
  return `\`!js ${funcName}\``;
}

function get_quoting_style() {
  let style =  VIM_VARS_MAP.get('ultisnips_python_quoting_style')|| 'double';
  if (style === 'single') {
    return SINGLE_QUOTES;
  }

  return DOUBLE_QUOTES;
}

function triple_quotes() {
  let style =  VIM_VARS_MAP.get('ultisnips_python_triple_quoting_style');
  if(!style) {
    return get_quoting_style().repeat(3);
  }
  if (style === 'double') {
    return DOUBLE_QUOTES.repeat(3);
  } else {
    return SINGLE_QUOTES.repeat(3);
  }
}

function get_markdown_title() {
  return jsFuncDecorator("js_markdown_title");
}

function js_markdown_title(vsContext: VSnipContext) {
  Logger.debug("Get doc:", vsContext.document);
  Logger.debug("Get pos:", vsContext.position);
  Logger.debug("Get tok:", vsContext.token);
  Logger.debug("Get ctx:", vsContext.context);
  let fn = vsContext.document.fileName;

  return path.basename(fn, path.extname(fn));
}


function var_parser(data: string) {
  // 只匹配let开头的语句, 并且要求只能是数字或是字符串
  // 数字可以不带引号, 字符串必须用单引号或是双引号包裹
  // 目前尚不能处理当前行的注释
  const VIM_VARS_PATERN = /^let g:(\w+)\s*=\s*(\d*|'[^\']*'|"[^\"]*")$/gm;
  let res = null;

  while ((res = VIM_VARS_PATERN.exec(data)) !== null) {
    let [_, key, value] = res as RegExpExecArray;
    // Logger.debug(key, value, res);
    // 正则表达式中的value带有'或是", 需要去掉
    VIM_VARS_MAP.set(key, value.replace(/['"]+/g, ""));
  }
}

// 读取给定文件中的vim变量
function init_vim_var(var_files: Array<string>) {
  var_files.forEach(file => {
    Logger.debug("Get file", file);
    try {
      const data = fs.readFileSync(file, "utf8");
      var_parser(data);
    } catch (error) {
      Logger.error("Can't parse the var file: ", file);
    }
  });
}

// 通过变量名获取vim中的变量
function get_vim_var(name: string) {
  if (VIM_VARS_MAP === null) {
    Logger.warn("There is no varilables in map");
    return "";
  }

  return VIM_VARS_MAP.get(name) || "";
}

function initTemplateFunc() {
  jsParser();
  BUILDIN_MODULE.set('get_quoting_style', get_quoting_style);
  BUILDIN_MODULE.set('get_markdown_title', get_markdown_title);
  BUILDIN_MODULE.set('triple_quotes', triple_quotes);
  BUILDIN_MODULE.set('js_markdown_title', js_markdown_title);
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

  Logger.info(`Can't get func buildin: ${name}, query user module`);

  func = USER_MODULE.get(name);
  return func
}

export {
  init_vim_var,
  get_vim_var,
  jsFuncDecorator,
  var_parser,
  initTemplateFunc,
  getTemplateFunc,
};

// 测试VIM配置的读取
function test_vim_read() {
  let TEST_VARS = [
    // only number
    `let g:ale_set_loclist = 1`,

    `let g:snips_author="corvo"`,

    // string with single quotes
    `let g:ale_echo_msg_error_str = 'Error'`,

    // string with single quotes
    `let g:ale_cpp_clangtidy_options = "p ./build/"`,

    // string with comments
    `let g:winManagerWindowLayout='NERDTree|TagList' "BufExplorer`
  ];
  TEST_VARS.forEach(varDef => {
    var_parser(varDef);
  });
  Logger.info(
    "Get var ale_cpp_clangtidy_options:",
    get_vim_var("ale_cpp_clangtidy_options")
  );
  Logger.info("Get var no_exist:", get_vim_var("no_exist"));
}

function main() {
  test_vim_read();
}
if (require.main === module) {
  main();
}
