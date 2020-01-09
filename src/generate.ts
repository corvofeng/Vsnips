import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Logger } from "./logger";
import { parse, Snippet } from "./parse";
import { VSnipContext } from "./vsnip_context";
import { getSnipsDirs } from "./kv_store";

// function ultisnipsToJSON(ultisnips: string) {
//   const snippets = parse(ultisnips);
//   Logger.debug(snippets);
//   return snippets;
// }

export async function generate(context: vscode.ExtensionContext) {
  // 记录哪些类型的语言已经增加过snippets, 已经增加过的不再重复.
  let has_repush: Map<string, boolean> = new Map();
  Logger.info("Start register vsnips");

  // Trigger snippet on every reasonable ascii character.
  const triggers: string[] = [];
  for (let i = 32; i <= 126; i++) {
    triggers.push(String.fromCharCode(i));
  }

  // 如果从一开始就解析所有的snippet文件, 势必会造成vscode启动卡顿的问题
  // 这里采取一种替换方案, 初始时, 只是注册一个`registerCompletionItemProvider`
  // 当用户真正触发补全操作时, 才会解析对应的snippets文件,
  // 将解析放在了用户第一次触发的阶段.

  // 1. 注册默认的completionItemProiver
  let defaultItem = vscode.languages.registerCompletionItemProvider(
    { scheme: "file" },
    {
      provideCompletionItems(document, position, token, context) {
        Logger.debug("Get completion item", document, position);
        repush(document.languageId);
        return null;
      }
    },
    ...triggers
  );
  context.subscriptions.push(defaultItem);

  Logger.info("Register vsnips success!!");

  // 2. 用户触发了补全事件, 此时依照文件类型, 查找对应的snippets文件
  //   查找snippets文件时, 需要注意两点:
  //    1. 注意all.snippets可以被所有语言使用(已经支持)
  //    2. 如果snippet中有extends语句, 说明可以继承其他语言的snippet(暂不支持)
  async function repush(fileType: string) {
    if (!has_repush.get(fileType)) {
      Logger.info("Repush the " + fileType + "from local dir");
      has_repush.set(fileType, true);
      getSnipsDirs().forEach(async snipDir => {
        let snipFileNames = ["all.snippets", `${fileType}.snippets`];

        for (let i = 0; i < snipFileNames.length; i++) {
          let snipFile = path.join(snipDir, snipFileNames[i]);
          Logger.info("Currently want search:", snipFile);
          if (!fs.existsSync(snipFile)) {
            Logger.warn(`The ${snipFile} not exists!!`);
            continue;
          }
          const data = fs.readFileSync(snipFile, "utf8");
          await innerGenerate(data, fileType);
        }
      });
      // Add the doc snippets for current file type, a little ugly.
      let docSnip = `snippet vdoc "${fileType} doc"\n` +
        `\`!p snip.rv = get_${fileType}_doc(snip)\`\n` +
        `endsnippet`;
      innerGenerate(docSnip, fileType);
    } else {
      Logger.debug(fileType, "has been added");
    }
  }

  // 主生成函数
  async function innerGenerate(data: string, needFileType: string) {
    const sel: vscode.DocumentFilter = {
      scheme: "file",
      language: needFileType
    };
    let snippets = await parse(data);

    const provider = vscode.languages.registerCompletionItemProvider(
      sel, // 指定代码语言
      {
        provideCompletionItems(document, position, token, context) {
          Logger.debug("Get completion item", document, position);
          const prevContentInLine = document.getText(new vscode.Range(position.line, 0, position.line, position.character));

          // Checks if the cursor is at a word, if so the word is our context, otherwise grab
          // everything until previous whitespace, and that is our contextWord.
          let range = document.getWordRangeAtPosition(position);
          if (!range) {
            let match = prevContentInLine.match(/\S*$/);
            const charPos = (match as RegExpMatchArray).index || 0;
            range = new vscode.Range(position.line, charPos, position.line, position.character);
          }
          const contextWord = document.getText(range);
          const shouldAddAll = 'vsnips'.startsWith(contextWord.toLowerCase());

          let compleItems: Array<vscode.CompletionItem> = [];
          snippets.forEach(snip => {
            let shouldAdd = shouldAddAll;
            if (!shouldAdd) {
              if (snip.prefix.startsWith(contextWord)) {
                shouldAdd = true;
              }
            }
            if (!shouldAdd) {
              return;
            }
            const completionItem = new vscode.CompletionItem(snip.prefix, vscode.CompletionItemKind.Snippet);
            completionItem.detail = `Vsnips-${snip.prefix}: ${ snip.descriptsion }`;
            completionItem.filterText = completionItem.detail;
            completionItem.sortText = completionItem.detail;
            completionItem.documentation = snip.descriptsion + "\n" + snip.body;
            const payload: ExpandSnippetCommandPayload = {
              snippet: snip,
              document,
              position,
              token,
              context,
            };
            // 调用 command 的时候才真正展开 snippet body
            completionItem.command = {
              command: 'Vsnips.expand',
              title: 'expand',
              arguments: [payload]
            };
            compleItems.push(completionItem);
          });
          return compleItems;
        },
      },
      ...triggers
    );

    await context.subscriptions.push(provider);
  }
}

export type ExpandSnippetCommandPayload = {
  snippet: Snippet
  document: vscode.TextDocument
  position: vscode.Position
  token: vscode.CancellationToken
  context: vscode.CompletionContext
};

/**
 * 会被 'Vsnips.expand' command 调用
 */
export function expandSnippet(editor: vscode.TextEditor, payload: ExpandSnippetCommandPayload) {
  const { snippet, document, position, token, context } = payload;
  const vSnipContext = new VSnipContext(
    document,
    position,
    token,
    context
  );
  const vsSnippet = new vscode.SnippetString(snippet.get_snip_body(vSnipContext));
  const contextWordRange = document.getWordRangeAtPosition(position);
  editor.insertSnippet(vsSnippet, contextWordRange, { undoStopBefore: false, undoStopAfter: false });
}
