"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename:kv_store.ts
 *
 *     Version: 1.0
 *  Created on: July 02, 2019
 *
 *      Author: corvo
 *=======================================================================
 */

// 此文件用于保存各种信息


import { Logger } from "./logger";
import * as zlib from "zlib";
import * as https from 'https';
import * as request from "request";
import * as fs from "fs";
import * as path from "path";

const USER_DIR = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : process.env.HOME + "/.local/share")
Logger.debug("Get usre dir", USER_DIR);

// In linux, the default vsnips dir is in:
//     ~/.local/share/Vsnips/Ultisnips/
const VsnipDir = path.join(USER_DIR, 'Vsnips', 'Ultisnips');

if (!fs.existsSync(VsnipDir)) {
  fs.mkdirSync(VsnipDir);
}


let DEFAULT_LANG = [
  'lua',
  'c',
  'cpp',
  'all',
  'javascript',
  'python',
];


const search_dirs = [
  VsnipDir,
  // path.join(process.env.HOME, '.vim', 'UltiSnips'),
  // '/home/corvo/.vim/UltiSnips',
  // '/home/corvo/.vim/plugged/vim-snippets/UltiSnips',
];

function DownloadSnips() {
  // Download snippets from: https://github.com/honza/vim-snippets
  DEFAULT_LANG.forEach((lang: string) => {
    let snipfile = path.join(VsnipDir, lang + '.snippets');
    if (!fs.existsSync(snipfile)) {
      Logger.debug("Create file: ", snipfile);
      const file = fs.createWriteStream(snipfile);
      const req = request.get(
        `https://raw.githubusercontent.com/honza/vim-snippets/master/UltiSnips/${lang}.snippets`
      ).pipe(file);
    }
  });
}
DownloadSnips();

export { VsnipDir };