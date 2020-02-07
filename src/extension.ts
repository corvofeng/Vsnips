// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
import { Logger, InitLogger } from "./logger";
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
  setEnableAutoTrigger
} from "./kv_store";
import { snippetManager, Snippet } from './snippet_manager';
import { initVimVar, initTemplateFunc, initVSCodeVar } from "./script_tpl";
import { checkLanguageId } from "./util";
import { VSnipWatcherArray } from "./vsnip_watcher";
import { VSnipContext } from "./vsnip_context";

export async function activate(context: vscode.ExtensionContext) {
  const conf = vscode.workspace.getConfiguration();
  const VsnipLogLvl = conf.get("Vsnips.LogLevel", "NO");
  setLogLevel(VsnipLogLvl);
  InitLogger();

  Logger.info(`Congratulations, your extension "Vsnips" (${context.extensionPath}) is now active!`);

  const useDefaultSnips = conf.get("Vsnips.UseDefaultSnips", true);
  if(useDefaultSnips) {
    const UltiSnipsDir = path.join(context.extensionPath, "Ultisnips");
    addSnipsDir([UltiSnipsDir]);
  }

  // 是否启用对于'A'这种选项的支持
  const enableAutoTrigger = conf.get("Vsnips.EnableAutoTrigger", true);
  setEnableAutoTrigger(enableAutoTrigger);

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
  const vscodeVars= new Map<string, string>(Object.entries(conf.get("Vsnips.VScodeVars", {})));
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

  generate(context);

  // 如果从一开始就解析所有的snippet文件, 势必会造成vscode启动卡顿的问题
  // 这里采取一种替换方案, 当用户打开某种语言的文件时, 才会解析对应的snippets文件
  vscode.workspace.onDidOpenTextDocument((document) => {
    // 此时依照文件类型, 查找对应的snippets文件
    snippetManager.addLanguage(checkLanguageId(document));
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
      (editor) => {
        const langId = editor.document.languageId;
        const items: Array<vscode.QuickPickItem & { snippet: Snippet }> = snippetManager.getSnippets(langId).map((snippet) => {
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
      let settingFile = updateMultiWorkspaceSetting();
      let uri = vscode.Uri.file(settingFile);
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
      if (VSnipWatcherArray.length === 0 && autoTriggeredSnips.length === 0) {
        return;
      }

      // 确认editor属于当前文档
      const editor = vscode.window.activeTextEditor;
      if(editor == undefined || editor.document != e.document) {
        Logger.warn("Can't process the correct editor");
        return;
      }

      // 处理auto triggered snippets
      autoTriggeredSnips.forEach((snip) => {
        if (isComplete) {
          return;
        }

        isComplete =  snip.get_snip_in_auto_triggered(
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
      if (VSnipWatcherArray.length > 1) {
        Logger.warn("There are two active VsnipWatcher, please check");
      }
      if (VSnipWatcherArray[0].getEditor().document !== e.document) {
        return;
      }
      Logger.debug("Call a watcher", VSnipWatcherArray[0]);
      VSnipWatcherArray[0].onUpdate(e.contentChanges);
    })
  );

}

// this method is called when your extension is deactivated
export function deactivate() {}
