

import { expect } from 'chai';
import 'mocha';

import { Logger, InitLogger } from "../../logger";
import { setLogLevel } from "../../kv_store";
import { FuncArg, TsFuncToken, PyFuncToken, GoFuncToken } from "../../doc_parse/token_obj";
import { parseTokenizer } from "../../doc_parse/tokenize";


describe('Tokenize', () => {
  beforeEach(function (done) {
    setLogLevel('WARNING');
    InitLogger();
    done();
  });

  it('Parse typesctipt function', () => {
    // [args] + [期望的返回值]
    let TEST_JS_AND_TS_FUNCS = [
      [ // 简单的JS函数
        ['function query_docs(q_str)', 'javascript'],
        [new TsFuncToken(
          "query_docs",
          [new FuncArg('q_str')],
          []
        )],
      ],
      [ // 基础的TS函数, 带返回类型
        ['function add(x: number, y: number): number', 'typescript'],
        [new TsFuncToken(
          "add",
          [new FuncArg('x', 'number', ''), new FuncArg('y', 'number', '')],
          [new FuncArg('', 'number', ''),]
        )],
      ],
      [ // TS函数, 结尾有空格或换行
        [`function func(a1: string, a2: number) {
          `, 'typescript'],
        [new TsFuncToken(
          'func',
          [new FuncArg('a1', 'string', ''), new FuncArg('a2', 'number', '')],
          []
        )]
      ],
      [ // 基础TS函数, 带返回类型, 增加了末尾的`{`
        ['function add(x: number, y: number): number {', 'typescript'],
        [new TsFuncToken(
          "add",
          [new FuncArg('x', 'number', ''), new FuncArg('y', 'number', '')],
          [new FuncArg('', 'number', ''),]
        )],
      ],
      [ // 可选参数的TS函数
        ['function me(firstName: string, lastName?: string)', 'typescript'],
        [new TsFuncToken(
          "me",
          [new FuncArg('firstName', 'string', ''), new FuncArg('lastName?', 'string', '')],
          []
        )],
      ],
      [ // 携带缺省值的函数
        ['function buildName(firstName: string, lastName = "Smith")', 'typescript'],
        [new TsFuncToken(
          "buildName",
          [new FuncArg('firstName', 'string', ''), new FuncArg('lastName', '', 'Smith')],
          []
        )],
      ],
      [ // 可变参数 有自己的类型
        ['function buildName(firstName: string, ...restOfName: string[]) {', 'typescript'],
        [new TsFuncToken(
          "buildName",
          [new FuncArg('firstName', 'string', ''), new FuncArg('restOfName', 'string[]', '')],
          []
        )],
      ],
      [ // 可变参数, 但是没有自己的类型
        ['function buildName(firstName: string, ...restOfName) {', 'typescript'],
        [new TsFuncToken(
          "buildName",
          [new FuncArg('firstName', 'string', ''), new FuncArg('restOfName', 'object[]', '')],
          []
        )],
      ],
      [
        ['function tsTokenizer(defs: string): TsFuncToken | undefined {', 'typescript'],
        [new TsFuncToken(
          "tsTokenizer",
          [new FuncArg('defs', 'string', '')],
          [new FuncArg('', 'TsFuncToken|undefined', '')]
        )],
      ],
    ];
    TEST_JS_AND_TS_FUNCS.forEach(c => {
      let tok = parseTokenizer(c[0][0] as string, c[0][1] as string);
      Logger.debug("Get tokobj: ", tok);

      if (c.length == 2) {
        let expectToken = c[1][0] as TsFuncToken;
        if (tok !== undefined) {
          Logger.debug("Wanna get ", expectToken, "get", tok);
          // expect(expectToken.isSameToken(tok)).equal(true);
          expect(expectToken).to.deep.equal(tok);
        } else {
          expect(tok === c[1][0]).equal(true);
        }
      }
    });
  });

  it('Parse python function', () => {
    let TEST_FUNCS = [
      [
        ['def query_docs(q_str):', 'python'],
        [new PyFuncToken(
          "query_docs",
          [new FuncArg('q_str', '', '')],
          []
        )]
      ],
      [
        ['def query_docs(q_str: string):', 'python'],
        [new PyFuncToken(
          "query_docs",
          [new FuncArg('q_str', 'string', '')],
          []
        )]
      ],
      [
        ['def query_docs(q_str: string=""):', 'python'],
        [new PyFuncToken(
          "query_docs",
          [new FuncArg('q_str', 'string', '')],
          []
        )]
      ],
      [
        ['def query_docs(eggs=None):', 'python'],
        [new PyFuncToken(
          "query_docs",
          [new FuncArg('eggs', '', 'None')],
          []
        )]
      ],
      [
        [`def query_docs(
        arg1,
        q_str: string
      ):
      `,
          'python'],
        [new PyFuncToken(
          "query_docs",
          [new FuncArg('arg1', '', ''), new FuncArg('q_str', 'string', '')],
          []
        )]
      ],
      [ // 还未支持class
        ['class example_cls(object):', 'python'],
        [undefined]
      ],
      [ // 还未通过单元测试
        ['def greeting(name: str) -> str:', 'python'],
        [new PyFuncToken(
          "greeting",
          [new FuncArg('name', 'str', '')],
          [new FuncArg('', 'str', '')]
        )]
      ],
      [
        ['    def greeting(name: str="") -> str:', 'python'],  // 包含缩进
        [new PyFuncToken(
          "greeting",
          [new FuncArg('name', 'str', '')],
          [new FuncArg('', 'str', '')]
        )]
      ],
      [ // 带有*args 与 **kwargs的函数
        ['def greeting(*args, **kwargs) -> str:', 'python'],
        [new PyFuncToken(
          "greeting",
          [new FuncArg('*args', '', ''), new FuncArg('**kwargs', '', '')],
          [new FuncArg('', 'str', '')]
        )]
      ],
      [  // 非函数定义
        ['import IPython; IPython.embed()', 'python'],
        [undefined],
      ],
      [  // 不完整的函数定义
        ['def greeting(name: str=""', 'python'],
        [undefined],
      ],
    ];
    TEST_FUNCS.forEach(c => {
      let tok = parseTokenizer(c[0][0] as string, c[0][1] as string) as PyFuncToken;
      if (c.length == 2) {
        let expectToken = c[1][0] as PyFuncToken;
        if (expectToken != undefined) {
          Logger.debug("Wanna get ", expectToken, "get", tok);
          expect(expectToken).to.deep.equal(tok);
        } else {
          expect(tok === c[1][0]).equal(true);
        }
      }
    });
  });

  it('Parse golang function', () => {
    let TEST_JS_AND_TS_FUNCS = [
      [ // 简单的JS函数
        ['func add(x int, y int) int {', 'golang'],
        [new GoFuncToken(
          "add",
          [new FuncArg('x', 'int'), new FuncArg('y', 'int')],
          [new FuncArg('', 'int')]
        )],
      ],
      [
        ['func nextInt(b []byte, i int) (int, int) {', 'golang'],
        [new GoFuncToken(
          "nextInt",
          [new FuncArg('b', '[]byte'), new FuncArg('i', 'int')],
          [new FuncArg('', 'int'), new FuncArg('', 'int')]
        )],
      ],
      [
        ['func playExampleFile(file *ast.File) *ast.File {', 'golang'],
        [new GoFuncToken(
          "playExampleFile",
          [new FuncArg('file', '*ast.File')],
          [new FuncArg('', '*ast.File')]
        )],
      ],
      [
        ['func (file *File) Write(b []byte) (n int, err error) {', 'golang'],
        [new GoFuncToken(
          "Write",
          [new FuncArg('b', '[]byte')],
          [new FuncArg('n', 'int'), new FuncArg('err', 'error')]
        )],
      ],
      [
        ['func nextInt0(b []byte, i int) (x1 int, x2 int) {', 'golang'],
        [new GoFuncToken(
          'nextInt0',
          [new FuncArg('b', '[]byte'), new FuncArg('i', 'int')],
          [new FuncArg('x1', 'int'), new FuncArg('x2', 'int')],
        )],
      ],
      [
        ['func nextInt1(b []byte, i int) (x1 int, ', 'golang'],
        [undefined],
      ],
      [ // 包含换行
        [`func nextInt2(b []byte, i int) (x1 int, 
  x2 int) {`, 'golang'],
        [new GoFuncToken(
          'nextInt2',
          [new FuncArg('b', '[]byte'), new FuncArg('i', 'int')],
          [new FuncArg('x1', 'int'), new FuncArg('x2', 'int')],
        )]
      ],

    ];

    TEST_JS_AND_TS_FUNCS.forEach(c => {
      let tok = parseTokenizer(c[0][0] as string, c[0][1] as string) as GoFuncToken;
      Logger.debug("Get tokobj: ", tok);
      if (c.length == 2) {
        let expectToken = c[1][0] as GoFuncToken;
        if (expectToken != undefined) {
          Logger.debug("Wanna get ", expectToken, "get", tok);
          expect(tok).to.deep.equal(expectToken);
        } else {
          expect(tok === undefined);
        }
      }
    });
  });
});