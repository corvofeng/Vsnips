import { Logger, InitLogger } from "../logger";
import * as fs from "fs";
import { setLogLevel } from "../kv_store";
import { expect } from "chai";
import * as path from "path";
import "mocha";

describe("Eval file", () => {
  beforeEach((done) => {
    setLogLevel("WARN");
    InitLogger();
    done();
  });

  it("Read and eval file", () => {
    const testsRoot = path.resolve(__dirname, "..", "..");
    const exampleFile = path.join(testsRoot, "./example/func.js");
    const TEST_CASE = ['console.log("Hello world");'];

    Logger.info("hello world");
    const data = fs.readFileSync(exampleFile, "utf8");
    Logger.info(data);
    // eslint-disable-next-line
    const LOG = Logger;
    // eslint-disable-next-line
    eval('LOG.info("hello from func");LOG.debug("debug from func");');

    // eslint-disable-next-line
    const d = eval(data) as object;
    Logger.info(d);
    TEST_CASE.forEach((content: string) => {
      Logger.info(content);
      // eslint-disable-next-line
      eval(data);
    });
    expect(7).equal(7);
  });
});
