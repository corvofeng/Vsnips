
import { expect } from 'chai';
import 'mocha';

import { Logger, InitLogger } from "../../logger";
import { setLogLevel } from "../../kv_store";
import { FuncArg, TsFuncToken } from "../../doc_parse/token_obj";

describe("Token obj", () => {
  beforeEach(function (done) {
    setLogLevel('WARNING');
    InitLogger();
    done();
  });

  it('Typescript function token', () => {
    let TEST_CASES = [
      [['q_str'], [new FuncArg('q_str')]],
      [['q_str:string'], [new FuncArg('q_str', 'string')]],
      [['q_str:string=""'], [new FuncArg('q_str', 'string', '""')]],
      [['a1:string'], [new FuncArg('a1', 'string', '')]],
      [['a1: string'], [new FuncArg('a1', 'string', '')]],
      [['eggs=None'], [new FuncArg('eggs', '', 'None')]],
      [['eggs: obj=None'], [new FuncArg('eggs', 'obj', 'None')]],
      [['lastName?: string'], [new FuncArg('lastName?', 'string', '')]],
      [['lastName = "Smith"'], [new FuncArg('lastName', '', "Smith")]],
      [['...args'], [new FuncArg('args', 'object[]', '')]],
      [['...restOfName: string[]'], [new FuncArg('restOfName', 'string[]', '')]],
    ];
    TEST_CASES.forEach((c) => {
      let funcArgs = TsFuncToken.constructArgFromTokens(c[0] as Array<string>);
      let a1 = funcArgs[0];
      let a2: FuncArg = c[1][0] as any;
      expect(a1).to.deep.equal(a2);
    });
  });

  it('Python function token', () => {
    let TEST_CASES = [
      [['q_str'], [new FuncArg('q_str')]],
      [['a1: string'], [new FuncArg('a1', 'string', '')]],
      [['q_str:string'], [new FuncArg('q_str', 'string')]],
      [['q_str:string=""'], [new FuncArg('q_str', 'string', '""')]],
      [['eggs=None'], [new FuncArg('eggs', '', 'None')]],
      [['eggs: obj=None'], [new FuncArg('eggs', 'obj', 'None')]],
    ];
    TEST_CASES.forEach((c) => {
      let funcArgs = TsFuncToken.constructArgFromTokens(c[0] as Array<string>);
      let a1 = funcArgs[0];
      let a2: FuncArg = c[1][0] as any;
      expect(a1.isSameArgs(a2)).equal(true);
    });
  });
});