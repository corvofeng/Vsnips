import { setLogLevel } from "../kv_store";
import { InitLogger } from "../logger";
import { trim } from "../util";
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
});
