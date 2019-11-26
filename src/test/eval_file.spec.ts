import { Logger, InitLogger } from "../logger";
import * as fs from "fs";
import { setLogLevel, addSnipsDir, getVarfiles, addVarfiles } from "../kv_store";
import { expect } from 'chai';
import 'mocha';


describe("Eval file", () => {

  beforeEach(function (done) {
    setLogLevel('WARNING');
    InitLogger();
    done();
  });

  it('Read and eval file', () => {
    let example_file = "./example/func.js";
    let TEST_CASE = [
      'console.log("Hello world");',
    ];

    Logger.info("hello world");
    const data = fs.readFileSync(example_file, "utf8");
    Logger.info(data);
    const LOG = Logger;
    eval('LOG.info("hello from func");LOG.debug("debug from func");');

    let d = eval(data) as object;
    Logger.info(d);
    TEST_CASE.forEach((content: string) => {
      //   Logger.info(content);
      //   eval(data);
    });
    expect(7).equal(7);
  });
});
