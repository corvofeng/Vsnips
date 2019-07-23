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


import { Logger } from "./logger";
import * as zlib from "zlib";
import * as https from 'https';
import * as request from "request";
import * as fs from "fs";
import * as path from "path";

let USER_DIR = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : process.env.HOME + "/.local/share")
console.log("Get usre dir", USER_DIR);
let VsnipDir = path.join(USER_DIR, 'Vsnips', 'Ultisnips');

if (!fs.existsSync(VsnipDir)) {
  fs.mkdirSync(VsnipDir);
}


let DEFAULT_LANG = [
  'lua',
  'c',
  'cpp',
  'all',
  'js',
];

DEFAULT_LANG.forEach((lang: string) => {
  let snipfile = path.join(VsnipDir, lang + '.snippets');
  Logger.debug("Create file: ", snipfile);
  const file = fs.createWriteStream(snipfile);
  const req = request.get(
    `https://raw.githubusercontent.com/honza/vim-snippets/master/UltiSnips/${lang}.snippets`
  ).pipe(file);
});


/*

const req = request.get(
  "https://github.com/honza/vim-snippets/archive/master.zip").pipe(file);
console.log("create ", file)
*/