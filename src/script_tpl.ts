"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename:script_tpl.ts
 *
 *     Version: 1.0
 *  Created on: July 02, 2019
 *
 *      Author: corvo
 *=======================================================================
 */

// For python.snippets
let SINGLE_QUOTES = "'";
let DOUBLE_QUOTES = '"';

let NORMAL = 0x1;
let DOXYGEN = 0x2;
let SPHINX = 0x3;
let GOOGLE = 0x4;
let NUMPY = 0x5;
let JEDI = 0x6;

function get_quoting_style() {
    return SINGLE_QUOTES;
}

export {
   get_quoting_style,
}
