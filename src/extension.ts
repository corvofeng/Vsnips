// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Logger, InitLogger } from "./logger";
import { generate, expandSnippet } from "./generate";
import {
  setLogLevel,
  addSnipsDir,
  getVarfiles,
  addVarfiles,
  clearSnipsDir,
  updateMultiWorkspaceSetting,
  addUserScriptFiles
} from "./kv_store";
import { snippetManager, Snippet } from './snippet_manager';
import { initVimVar, initTemplateFunc, initVSCodeVar } from "./script_tpl";

export async function activate(context: vscode.ExtensionContext) {
  const conf = vscode.workspace.getConfiguration();
  const VsnipLogLvl = conf.get("Vsnips.LogLevel", "NO");
  setLogLevel(VsnipLogLvl);
  InitLogger();

  Logger.info('Congratulations, your extension "Vsnips" is now active!');

  const useDefaultSnips = conf.get("Vsnips.UseDefaultSnips", true);
  if (!useDefaultSnips) {
    Logger.warn("Currently we don't use the default snips dir.");
    clearSnipsDir();
  }

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

  generate(context);

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
}

// this method is called when your extension is deactivated
export function deactivate() {}
