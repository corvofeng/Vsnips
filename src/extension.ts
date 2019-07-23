// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Logger } from "./logger";
import { generate } from "./generate";
import { init_vim_var } from "./script_tpl";

// 记录
let DEFAULT_VARS_FILES = [
  '/home/corvo/.vimrc',
  '/home/corvo/.vim/common.vim',
];

// 用户当前的可以放置配置文件的位置
// Copy from: https://stackoverflow.com/a/26227660
let USER_DIR = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : process.env.HOME + "/.local/share")

let DEFAULT_ENABLE_SYNTAX = [
  '*'
];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  Logger.info('Congratulations, your extension "Vsnips" is now active!');

  const VsnipDirs = vscode.workspace.getConfiguration().get('Vsnips.snipdir');
  Logger.info("Get Vsnip dirs ", VsnipDirs, "now we start create snippets");
  init_vim_var(DEFAULT_VARS_FILES);

  await generate(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
