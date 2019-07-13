import { Logger } from "./logger";
import * as ScriptFunc from "./script_tpl";

const VIM_SNIPPET = /^snippet ([^\s]*)\s*(?:"(.*?)".*)?\n((?:.|\n)*?)\nendsnippet$/gm;

class Snippet {
  prefix: string;
  body: string;
  descriptsion: string;

  constructor() {
    this.prefix = '';
    this.body = '';
    this.descriptsion = '';
  }
}

function parse(rawSnippets: string): Array<Snippet> {
  let res = null;
  let snips: Array<Snippet> = [];
  while ((res = VIM_SNIPPET.exec(rawSnippets)) !== null) {
    const [_, prefix, description, body] = res;

    let snip = new Snippet();
    snip.prefix = prefix;
    snip.body = normalizePlaceholders(body)
    snip.body = lexParser(snip.body);
    snip.descriptsion = description;

    Logger.debug("prefix: ", snip.prefix);
    Logger.debug("description: ", snip.descriptsion);
    Logger.debug("body: ", snip.body);
    snips.push(snip);
  }
  return snips;
}

// 这部分代码用于实现从vim 或是 python函数 => js函数的转换
// 主要应用了正则替换.
function lexParser(str: string) {
  // 检查所有(``)包裹的部分, 并确保里面没有嵌套(`)
  // 不允许多行包含多行
  const SNIP_FUNC_PATTERN = /`([^\`]+)\`/g;

  const FT_UNKNOW = 0x0;
  const FT_VIM = 0x1;
  const FT_PYTHON = 0x2;
  const FT_JAVASCRIPT = 0x3;

  Logger.debug("Before parse", str);
  let res = null;
  let rlt = '';
  // 记录需要替换的值, 最后统一替换
  let replaceArray = [];

  while ((res = SNIP_FUNC_PATTERN.exec(str)) !== null) {
    let [stmt, func] = res as RegExpExecArray;
    Logger.debug("Get parser", stmt);

    let func_type = FT_PYTHON;
    if (func.startsWith('!p')) {
      func_type = FT_PYTHON;
    } else if (func.startsWith('!v')) {
      func_type = FT_VIM;
    } else if (func.startsWith('!js')) {
      // TODO: make my own func
      func_type = FT_JAVASCRIPT;
    } else {
      func_type = FT_UNKNOW;
    }

    switch (func_type) {
      case FT_PYTHON:
        rlt = pythonRewrite(func);
        replaceArray.push([stmt, rlt]);
        break;

      case FT_VIM:
        rlt = vimRewrite(func);
        replaceArray.push([stmt, rlt]);
        break;
      case FT_JAVASCRIPT:
        break;

      default:
        break;
    }

    Logger.info("After replace stmt", stmt, "we got: ", str);
  }
  replaceArray.forEach((pair) => {
    let [stmt, rlt] = pair;
    str = str.replace(stmt, rlt);
  });

  return str;
}

function pythonRewrite(stmt: string) {
  // 用于处理这一类字符串: `!p snip.rv = get_quoting_style(snip)`
  Logger.debug("Wanna rewrite python", stmt);

  let func_name_pattern = /(\w+)\(snip\)/;

  if(func_name_pattern.test(stmt)) {
    let [_, func_name] = func_name_pattern.exec(stmt) as RegExpExecArray;
    Logger.info("Get func name", func_name);
    let func = null;
    try {
      func = (ScriptFunc as any)[func_name as string];
      return func();
    } catch(e) {
      Logger.error("In python func", e);
      return '';
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

  if(time_func_pattern.test(stmt)) {
    let [_, time_fmt] = time_func_pattern.exec(stmt) as RegExpExecArray;
    Logger.debug("Get time fmt", time_fmt);
    // Please refer to:
    //   https://code.visualstudio.com/docs/editor/userdefinedsnippets#_variables
    let replace_table = [
      ['%Y', '$CURRENT_YEAR'],
      ['%B', '$CURRENT_MONTH_NAME'],
      ['%m', '$CURRENT_MONTH'],
      ['%d', '$CURRENT_DATE'],
      ['%H', '$CURRENT_HOUR'],
      ['%M', '$CURRENT_MINUTE'],
      ['%S', '$CURRENT_SECOND'],
    ];
    replace_table.forEach((time_func) => {
      let [vim_time_func, vscode_time_func] = time_func;
      time_fmt = time_fmt.replace(vim_time_func, vscode_time_func);
    });
    stmt = time_fmt;
  } else if(variable_pattern.test(stmt)) {
    let [_, variable_name] = variable_pattern.exec(stmt) as RegExpExecArray;
    Logger.debug("Get var", variable_name);
    stmt = ScriptFunc.get_vim_var(variable_name);
  }

  return stmt;
}

function normalizePlaceholders(str: string) {
  const visualPlaceholder = /\${(\d):\${VISUAL}}/;
  if (visualPlaceholder.test(str)) {
    let data = visualPlaceholder.exec(str) as RegExpExecArray;
    const n = data[1];
    Logger.info("Get visual data", data, n);
    return str.replace(visualPlaceholder, `$${n}`);
  } else {
    return str;
  }
}

export { parse };


// This is for unittest.

function main() {
  let TEST_CASE = [
    // simple snippets
    `snippet gitig "Git add will ignore this"
####### XXX: Can't GIT add [START] #########
$1
####### XXX: Can't GIT add  [END]  #########
endsnippet
`,
    // snippets with python
    `snippet ifmain "ifmain" b
if __name__ == \`!p snip.rv = get_quoting_style(snip)\`__main__\`!p snip.rv = get_quoting_style(snip)\`:
	\${1:\${VISUAL:main()}}
	\${2:\${VISUAL}}
endsnippet`,

    // snippets with vim script
    `snippet full_title "Python title fully"
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# vim: ts=4 sw=4 tw=99 et:

"""
@Date   : \`!v strftime("%B %d, %Y")\`
@Author : \`!v g:snips_author\`

"""

endsnippet`,

  `snippet title "Hexo post header" b
---
layout: post
title: \`!p snip.rv = get_markdown_title(snip)\`
date: \`!v strftime("%Y-%m-%d %H:%M:%S")\`
author: \`!v g:snips_author\`
tags: 
description: ${3}
categories: Docs
photos:  
toc: true

---

${0}
endsnippet`
  ];

  let TEST_VAR_FILES = [
    '/home/corvo/.vim/common.vim',
  ];
  ScriptFunc.init_vim_var(TEST_VAR_FILES);

  TEST_CASE.forEach((txt: string) => {
    // Logger.debug(parse(txt));
    parse(txt);
  });
}

if (require.main === module) {
  main();
}