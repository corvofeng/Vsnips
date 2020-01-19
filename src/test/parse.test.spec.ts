import * as assert from "assert";
import * as ScriptFunc from "../script_tpl";
import { parse } from "../parse";
import { setLogLevel, addSnipsDir, getVarfiles, addVarfiles } from "../kv_store";
import { Logger, InitLogger } from "../logger";

// suite("Parser Tests", function() {
//   test("Somethins 1", function() {
//     parse("hello world");
//   });
// });

// This is for unittest.

describe('Parse ultisnips', () => {
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
endsnippet`,

    `snippet class "class with docstrings" b
class \${1:MyClass}(\${2:object}):

  \`!p snip.rv = triple_quotes(snip)\`\${3:Docstring for $1. }\`!p snip.rv = triple_quotes(snip)\`

  def __init__(self$4):
    \`!p snip.rv = triple_quotes(snip)\`\${5:TODO: to be defined.}\`!p
snip.rv = ""
snip >> 2

args = get_args(t[4])

write_docstring_args(args, snip)
if args:
  snip.rv += '\n' + snip.mkline('', indent='')
  snip += '{0}'.format(triple_quotes(snip))

write_init_body(args, t[2], snip)
\`
    $0
endsnippet`,

    `snippet vbox "box" w
\`!p snip.rv = get_simple_box(snip)\`
endsnippet`,
  ];
  it('parser', () => {
    let TEST_VAR_FILES = [
      '/home/corvo/.vim/common.vim',
    ];
    ScriptFunc.initVimVar(TEST_VAR_FILES);
    setLogLevel('WARNING');
    InitLogger();

    TEST_CASE.forEach((txt: string) => {
      let snippet = parse(txt);
      // Logger.warn(snippet);
    });
  });
  // parse(TEST_CASE[TEST_CASE.length - 1]);
});
