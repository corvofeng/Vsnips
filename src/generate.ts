import * as fs from "fs";
import * as path from "path";
import { Logger } from "./logger";
import { parse } from "./parse";
import * as vscode from "vscode";
import { VSnipContext } from "./vsnip_context";
import { getSnipsDirs } from "./kv_store";

function ultisnipsToJSON(ultisnips: string) {
  const snippets = parse(ultisnips);
  Logger.debug(snippets);
  return snippets;
}

async function generate(context: vscode.ExtensionContext) {
  // 记录哪些类型的语言已经增加过snippets, 已经增加过的不再重复.
  let has_repush: Map<string, boolean> = new Map();
  Logger.info("Start register vsnips");

  // 如果从一开始就解析所有的snippet文件, 势必会造成vscode启动卡顿的问题
  // 这里采取一种替换方案, 初始时, 只是注册一个`registerCompletionItemProvider`
  // 当用户真正触发补全操作时, 才会解析对应的snippets文件,
  // 将解析放在了用户第一次触发的阶段.

  // 1. 注册默认的completionItemProiver
  let defaultItem = vscode.languages.registerCompletionItemProvider(
    { scheme: 'file'},
    {
      provideCompletionItems(document, position, token, context) {
        Logger.debug("Get completion item", document, position);
        repush(document.languageId);
        return null;
      }
    },
    "v", "V"
  );
  context.subscriptions.push(defaultItem);

  Logger.info("Register vsnips success!!");
  return; // 插件初始化操作已经结束, 直接return

  // 2. 用户触发了补全事件, 此时依照文件类型, 查找对应的snippets文件
  async function repush(fileType: string) {
    if (!has_repush.get(fileType)) {
      Logger.info("Repush the " + fileType + "from local dir");
      has_repush.set(fileType, true);
      getSnipsDirs().forEach(async snipDir => {
        await inner_generate(snipDir, fileType);
      });
    } else {
      Logger.debug(fileType, " has been added");
    }
  }

  // 主生成函数,
  async function inner_generate(dirname: string, needFileType: string) {
    fs.readdir(dirname, function(err, files) {
      if (err) {
        Logger.error(err);
        return;
      }
      files.forEach(async (file, index) => {
        Logger.info("In snippets ", file);

        let res = /([^\s]*)\.snippets$/.exec(file);
        if (res === null) {
          Logger.warn("Can't parse ", file);
          return;
        }

        const [_, fileNameType] = res;
        let f_name = path.join(dirname, file);
        if (fileNameType !== "all" && fileNameType !== needFileType) {
          Logger.info(`We need ${needFileType} but get ${fileNameType} stop parse!!`);
          return;
        }
        const sel: vscode.DocumentFilter = { scheme: "file", language: fileNameType};
        const data = fs.readFileSync(f_name, "utf8");
        let snippets = await ultisnipsToJSON(data);

        let item = vscode.languages.registerCompletionItemProvider(
          sel, // 指定代码语言
          {
            provideCompletionItems(document, position, token, context) {
              Logger.debug("Get completion item", document, position);
              let compleItems: Array<vscode.CompletionItem> = [];
              let vSnipContext = new VSnipContext(
                document,
                position,
                token,
                context
              );
              snippets.forEach(snip => {
                const snippetCompletion = new vscode.CompletionItem(
                  snip.prefix
                );
                snippetCompletion.documentation =
                  snip.descriptsion + "\n" + snip.body;
                snippetCompletion.label = `Vsnips-${snip.prefix}: ${
                  snip.descriptsion
                }`;
                snippetCompletion.insertText = new vscode.SnippetString(
                  snip.get_snip_body(vSnipContext)
                );
                compleItems.push(snippetCompletion);
              });
              return compleItems;
            }
          },
          "V",
          "v"
        );
        await context.subscriptions.push(item);
        // completItems.push(item);
        // completItems.forEach((item) => {
        //   context.subscriptions.push(item);
        // });
      });
    });
  }
}
export { generate };
