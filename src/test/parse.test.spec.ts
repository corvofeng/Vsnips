import * as ScriptFunc from "../script_tpl";
import { parse, Snippet } from "../parse";
import { setLogLevel } from "../kv_store";
import { InitLogger } from "../logger";
import { expect } from "chai";
import { VSnipContext } from "../vsnip_context";
import * as vscode from "vscode";

describe("Parse ultisnips", () => {
  beforeEach(done => {
    setLogLevel("WARN");
    InitLogger();
    // 需要删除变量设置
    ScriptFunc.clearVimVar();
    done();
  });

  it("parser", () => {
    const TEST_CASE = [
      // simple snippets
      [
        `snippet gitig "Git add will ignore this"
####### XXX: Can't GIT add [START] #########
$1
####### XXX: Can't GIT add  [END]  #########
endsnippet
      `,
        new Snippet(
          "gitig",
          "Git add will ignore this",
          "",
          `####### XXX: Can't GIT add [START] #########
$1
####### XXX: Can't GIT add  [END]  #########`,
          false
        )
      ],

      // snippets with python
      [
        `snippet ifmain "ifmain" b
if __name__ == \`!p snip.rv = get_quoting_style(snip)\`__main__\`!p snip.rv = get_quoting_style(snip)\`:
    \${1:\${VISUAL:main()}}
    \${2:\${VISUAL}}
endsnippet`,
        new Snippet(
          "ifmain",
          "ifmain",
          "b",
          `if __name__ == "__main__":
    \${1:\${VISUAL:main()}}
    $2`
        )
      ],

      // snippets with vim script
      [
        `snippet full_title "Python title fully"
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# vim: ts=4 sw=4 tw=99 et:

"""
@Date   : \`!v strftime("%B %d, %Y")\`
@Author : \`!v g:snips_author\`

"""

endsnippet`,
        new Snippet(
          "full_title",
          "Python title fully",
          "",
          `#!/usr/bin/env python
# -*- coding: utf-8 -*-
# vim: ts=4 sw=4 tw=99 et:

"""
@Date   : $CURRENT_MONTH_NAME $CURRENT_DATE, $CURRENT_YEAR
@Author : corvo

"""
`
        )
      ],

      [
        `snippet title "Hexo post header" b
---
layout: post
title: \`!p snip.rv = get_markdown_title(snip)\`
date: \`!v strftime("%Y-%m-%d %H:%M:%S")\`
author: \`!v g:snips_author\`
tags:
description: \${3}
categories: Docs
photos:
toc: true

---

\${0}
endsnippet`,
        new Snippet(
          "title",
          "Hexo post header",
          "b",
          `---
layout: post
title: \`!js js_markdown_title\`
date: $CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE $CURRENT_HOUR:$CURRENT_MINUTE:$CURRENT_SECOND
author: corvo
tags:
description: \${3}
categories: Docs
photos:
toc: true

---

\${0}`,
          true
        )
      ],

      [
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

        new Snippet(
          "class",
          "class with docstrings",
          "b",
          `class \${1:MyClass}(\${2:object}):

  """\${3:Docstring for $1. }"""

  def __init__(self$4):
    """\${5:TODO: to be defined.}"""
    $0`
        )
      ],

      [
        `snippet vbox "box" w
\`!p snip.rv = get_simple_box(snip)\`
endsnippet`,
        new Snippet("vbox", "box", "w", "`!js js_get_simple_box`", true)
      ],
      [
        `snippet cwfn "console with current filename"
console.log('[\${1:\`!v expand('%:r')\`}]', $2)
endsnippet`,
        new Snippet(
          "cwfn",
          "console with current filename",
          "",
          "console.log('[${1:`!js js_get_vim_expand(\"%:r\")`}]', $2)",
          true
        )
      ],
      [
        `snippet ,, "ldots" iA
, \\ldots, $0
endsnippet`,
        new Snippet(
          ",,",
          "ldots",
          "iA",
          ", \\ldots, $0",
          false
        )
      ]
    ];

    ScriptFunc.initVSCodeVar(new Map([["snips_author", "corvo"]])),
      TEST_CASE.forEach(([_t, _s]) => {
        const txt = _t as string;
        const snip = _s as Snippet;
        const snippet = parse(txt)[0];

        expect(snippet).deep.eq(snip);
      });
  });
  it("Test js func eval", () => {
    // 测试带有参数的js函数
    const ExampleVSCntext = new VSnipContext(
      {
        uri: vscode.Uri.parse("/home/corvo/Project/WebTools/README.md"),
        fileName: "/home/corvo/Project/WebTools/README.md",
        isUntitled: false,
        languageId: "markdown",
        version: 8,
        isClosed: false,
        isDirty: true,
        eol: 1,
        lineCount: 1
      } as vscode.TextDocument,
      {
        line: 0,
        character: 1
      } as vscode.Position,
      {} as vscode.CancellationToken,
      {} as vscode.CompletionContext
    );
    const TEST_VARS = [
      ["title: `!js js_markdown_title`", "title: README"],
      [
        "console.log('[${1:`!js js_get_vim_expand(\"%:r\")`}]', $2)",
        "console.log('[${1:README}]', $2)"
      ]
    ];
    ScriptFunc.initTemplateFunc();
    TEST_VARS.forEach(([_snip, _rlt]) => {
      const snip = new Snippet("", "", "", _snip, true);
      expect(snip.get_snip_body(ExampleVSCntext)).eq(_rlt);
    });
  });
});
