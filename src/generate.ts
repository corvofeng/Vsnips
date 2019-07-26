
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from "./logger";
import { parse } from './parse';
import * as vscode from "vscode";
import { VSnipContext } from './vsnip_context';
import { getSnipsDirs } from './kv_store';

function ultisnipsToJSON(ultisnips: string) {
  const snippets = parse(ultisnips);
  Logger.debug(snippets);
  return snippets;
}

async function generate(context: vscode.ExtensionContext) {

  // 记录哪些类型的语言已经增加过snippets, 已经增加过的不再重复.
  let has_repush: Map<string, boolean> = new Map();

  // 如果从一开始就解析所有的snippet文件, 势必会造成vscode启动卡顿的问题
  // 这里采取一种替换方案, 初始时, 只是注册一个`registerCompletionItemProvider`
  // 当用户真正触发补全操作时, 才会解析对应的snippets文件,
  // 将解析放在了用户第一次触发的阶段.

  // 1. 注册默认的completionItemProiver
  let defaultItem = vscode.languages.registerCompletionItemProvider(
    "*",
    {
      async provideCompletionItems(document, position, token, context) {
        await repush(document.languageId);
        return null;
      }
    },
    "*",
  );
  context.subscriptions.push(defaultItem);

  return;  // 插件初始化操作已经结束, 直接return


  // 2. 用户触发了补全事件, 此时依照文件类型, 查找对应的snippets文件
  async function repush(fileType: string) {
    if (!has_repush.get(fileType)) {
      Logger.info("Repush the " + fileType + "from local dir");
      has_repush.set(fileType, true);
      getSnipsDirs().forEach(async (snipDir) => {
        await inner_generate(snipDir, fileType);
      })
    }
  }
  // search_dirs.forEach(async (dirname) => {
  //   inner_generate(dirname);
  // });

  // 主生成函数, 
  async function inner_generate(dirname: string, fileType: string) {
    fs.readdir(dirname, function (err, files) {
      if (err) {
        Logger.error(err);
        return;
      }
      files.forEach(async (file, index) => {
        Logger.info("In snippets ", file);

        let res = /([^\s]*)\.snippets$/.exec(file);
        if (res === null) {
          Logger.warn("Can't parse ", file)
          return;
        }

        const [_, file_type] = res;
        let f_name = path.join(dirname, file);
        let sel: vscode.DocumentFilter;
        if (file_type === 'all') {
          sel = { scheme: 'file' };
        } else {
          sel = { scheme: 'file', language: file_type };
        }

        if (file != `${file_type}.snippets`) return;
        const data = fs.readFileSync(f_name, 'utf8');
        let snippets = await ultisnipsToJSON(data);

        let item = vscode.languages.registerCompletionItemProvider(
          sel,  // 指定代码语言
          {
            provideCompletionItems(document, position, token, context) {
              Logger.debug("Get completion item", document, position, token, context);
              // repush();
              let compleItems: Array<vscode.CompletionItem> = [];
              let vSnipContext = new VSnipContext(document, position, token, context);
              snippets.forEach((snip) => {
                const snippetCompletion = new vscode.CompletionItem(snip.prefix);
                snippetCompletion.documentation = snip.descriptsion + '\n' + snip.body;
                snippetCompletion.label = `Vsnips-${snip.prefix}: ${snip.descriptsion}`;
                snippetCompletion.insertText = new vscode.SnippetString(
                  snip.get_snip_body(vSnipContext)
                );
                compleItems.push(snippetCompletion);
              });
              return compleItems;
            }
          },
          "V", "v",
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
