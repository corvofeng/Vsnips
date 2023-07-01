// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import * as path from "path";
import *as fs from 'fs';
import { Logger, InitLogger } from "./logger";
import { VSnipsCodelensProider } from "./codelens_provider";
import { generate, expandSnippet } from "./generate";
import {
  setLogLevel,
  addSnipsDir,
  getVarfiles,
  addVarfiles,
  updateMultiWorkspaceSetting,
  addUserScriptFiles,
  setDisplayStrategy,
  setTrigers,
  getAutoTriggeredSnips,
  setEnableAutoTrigger,
  setLabelPrefix,
  addIgnoredSnippets,
  setIsInBrowser,
  isInBrowser,
} from "./kv_store";
import { snippetManager, Snippet } from './snippet_manager';
import { initVimVar, initTemplateFunc, initVSCodeVar } from "./script_tpl";
import { checkLanguageId } from "./util";
import { VSnipWatcherArray } from "./vsnip_watcher";
import { VSnipContext } from "./vsnip_context";

export async function activate(context: vscode.ExtensionContext) {
  const conf = vscode.workspace.getConfiguration();
  const VsnipLogLvl = conf.get("Vsnips.LogLevel", "NO");
  const UltiSnipsdDefaultDir = path.join(context.extensionUri.fsPath, "Ultisnips");
  if(typeof fs.existsSync === 'function') {
    setIsInBrowser(false);
  } else {
    setIsInBrowser(true);
  }
  Logger.info(`Congratulations, your extension "Vsnips" (${context.extensionUri}) is now active! In browser: ${isInBrowser()}`);
  setLogLevel(VsnipLogLvl);
  InitLogger();

  const useDefaultSnips = conf.get("Vsnips.UseDefaultSnips", true);
  if (useDefaultSnips) {
    addSnipsDir([UltiSnipsdDefaultDir]);
  }

  // 是否启用对于'A'这种选项的支持
  const enableAutoTrigger = conf.get("Vsnips.EnableAutoTrigger", true);
  setEnableAutoTrigger(enableAutoTrigger);

  const labelPrefix = conf.get("Vsnips.LabelPrefix", "");
  setLabelPrefix(labelPrefix);

  // 添加snips文件夹
  const vsnipDirs = conf.get("Vsnips.SnipsDir", []);
  Logger.info("Get Vsnip dirs ", vsnipDirs, "now we start create snippets");
  addSnipsDir(vsnipDirs);

  // 添加vim变量
  const vimFiles = conf.get("Vsnips.VarFiles", []);
  Logger.info("Get Vimfiles ", vimFiles, "now we start create snippets");
  addVarfiles(vimFiles);
  initVimVar(getVarfiles());

  // 用户自己的脚本文件
  const userScriptFiles = conf.get("Vsnips.UserScriptFiles", []);
  Logger.info("Get user script files: ", userScriptFiles);
  addUserScriptFiles(userScriptFiles);

  // 添加VSCode变量
  const vscodeVars = new Map<string, string>(Object.entries(conf.get("Vsnips.VScodeVars", {})));
  Logger.info("Get vscode variables: ", vscodeVars);
  initVSCodeVar(vscodeVars);

  initTemplateFunc();

  // 获取展示策略
  const displayStrategy = conf.get("Vsnips.DisplayStrategy", "ALL");
  Logger.info("Get user display strategy:", displayStrategy);
  setDisplayStrategy(displayStrategy);

  // 获取触发键位
  const trigers = conf.get("Vsnips.trigers", []);
  Logger.info("Get user trigers:", displayStrategy);
  setTrigers(trigers);

  // 我们可能不希望使用某些文件中的配置, 因此做个过滤, 将其中的片段忽略
  const ignoredSnippets: string[] = conf.get("Vsnips.IgnoredSnippets", []);
  Logger.info("Get ignored snippets: ", ignoredSnippets);
  ignoredSnippets.forEach((ignoredSnippet) => {
    const realPath = ignoredSnippet.replace("{DEFAULT_PATH}", UltiSnipsdDefaultDir);
    const snipDatas = realPath.split(':');
    if (snipDatas.length !== 2) {
      Logger.warn(`${realPath} Can't be parsed`);
      return;
    }
    Logger.info(`get real path ${realPath}`);
    addIgnoredSnippets([realPath]);
  });

  let inTestMode: Boolean = false;
  try {
    // https://github.com/microsoft/vscode/issues/102323
    // https://github.com/microsoft/vscode/issues/95926
    // introduced in 1.47.0, compatible code!!!
    if ((context as any).extensionMode === (vscode as any).ExtensionMode.Test) {
      inTestMode = true;
    }
  } catch (error) {
    Logger.error("Get error", error);
  }

  if (inTestMode) {
    Logger.info("This is in test mode, do not generate context");
  } else {
    generate(context);
  }

  // 如果从一开始就解析所有的snippet文件, 势必会造成vscode启动卡顿的问题
  // 这里采取一种替换方案, 当用户打开某种语言的文件时, 才会解析对应的snippets文件
  vscode.workspace.onDidOpenTextDocument(async (document) => {
    // 此时依照文件类型, 查找对应的snippets文件
    await snippetManager.addLanguage(checkLanguageId(document));
  });

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'Vsnips.expand',
      (editor, _, payload) => {
        expandSnippet(editor, payload);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'Vsnips.show_available_snippets',
      async (editor) => {
        const langId = checkLanguageId(editor.document);
        Logger.info(`Get ${langId} available snippet`);
        const items: Array<vscode.QuickPickItem & { snippet: Snippet }> = (await snippetManager.getSnippets(langId)).map((snippet) => {
          return {
            label: snippet.prefix,
            detail: snippet.descriptsion,
            snippet,
          };
        });
        vscode.window.showQuickPick(items, {
          placeHolder: 'Expand a Vsnips snippet',
        }).then((pickedItem) => {
          if (pickedItem) {
            expandSnippet(editor, {
              snippet: pickedItem.snippet,
              document: editor.document,
              position: editor.selection.active,
            });
          }
        });
      }
    )
  );

  //  允许用户编辑snippets, 此操作将会打开新的window.
  context.subscriptions.push(
    vscode.commands.registerCommand("Vsnips.edit_vsnips", () => {
      const settingFile = updateMultiWorkspaceSetting();
      const uri = vscode.Uri.file(settingFile);
      vscode.commands.executeCommand("vscode.openFolder", uri, true);
    })
  );

  // 所有的文本修改事件均会进入
  // 但只有在注册了Watcher事件之后, 并且Watcher的document与e.document的改动一致时
  // Watcher才会被触发,
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      const autoTriggeredSnips = getAutoTriggeredSnips();
      let isComplete = false;
      if (VSnipWatcherArray.size() === 0 && autoTriggeredSnips.length === 0) {
        return;
      }

      // 确认editor属于当前文档
      const editor = vscode.window.activeTextEditor;
      if (editor == undefined || editor.document != e.document) {
        Logger.warn("Can't process the correct editor");
        return;
      }

      // 处理auto triggered snippets
      autoTriggeredSnips.forEach((snip) => {
        if (isComplete) {
          return;
        }

        isComplete = snip.get_snip_in_auto_triggered(
          new VSnipContext(
            e.document,
            editor.selection.end
          ),
          editor
        );
      });

      if (isComplete) {
        return;
      }
      if (VSnipWatcherArray.size() > 1) {
        Logger.warn("There are two active VsnipWatcher, please check");
      }
      if (VSnipWatcherArray.firstWatcher().getEditor().document !== e.document) {
        return;
      }
      Logger.debug("Call a watcher", VSnipWatcherArray.firstWatcher());
      VSnipWatcherArray.firstWatcher().onUpdate(e.contentChanges);
    })
  );

  vscode.languages.registerCodeLensProvider("*", VSnipsCodelensProider);
}

// this method is called when your extension is deactivated
export function deactivate() { }
