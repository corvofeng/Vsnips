import { setLogLevel } from "../kv_store";
import { InitLogger } from "../logger";
import { trim, escapeDoubleQuote, escapeReverseSlash, argsToList } from "../util";
import { expect } from "chai";

describe("Test utils", () => {
  beforeEach(done => {
    setLogLevel("WARN");
    InitLogger();
    done();
  });
  it("test trim", () => {
    const TEST_CASE = [
      ["|hello|world   ", ["|", " "], "hello|world"],
      ["|hello| world  ", "| ", "hello| world"],
      ["", "", ""],
      ["", " ", ""],
      [" b", " ", "b"],
      [undefined, "", ""],
    ];
    TEST_CASE.forEach(([a1, a2, rlt]) => {
      const arg1 = a1 as string;
      const arg2 = a2 as string[];
      const result = rlt as string;
      expect(trim(arg1, arg2)).deep.eq(result);
    });
  });
  it("Test escape double quote", () => {
    const TEST_CASE = [
      [`Have you read, "The Jungle"?`, 'Have you read, \\"The Jungle\\"?'],
      [``, ``],
    ];
    TEST_CASE.forEach(([_in, _out]) => {
      expect(escapeDoubleQuote(_in)).eq(_out);
    });
  });
  it("Test escape reverse slash", () => {
    const TEST_CASE = [
      ["This is a slash \\!", "This is a slash \\\\!"],
      [``, ``],
    ];
    TEST_CASE.forEach(([_in, _out]) => {
      expect(escapeReverseSlash(_in)).eq(_out);
    });
  });
  it("Test argsToList", () => {
    const TEST_CASE = [
      [``, []],
      [`, "hello"`, ["hello"]],
      [`, "hello",`, ["hello"]],
      [`, "he,llo",`, ["he,llo"]],
    ];
    TEST_CASE.forEach(([_in, _out]) => {
      expect(argsToList(_in as string)).to.eql(_out);
    });
  });
});
