import { Logger, InitLogger } from "../logger";
import * as fs from "fs";
import { setLogLevel, addSnipsDir, getVarfiles, addVarfiles } from "../kv_store";

function main() {
  setLogLevel('DEBUG');
  InitLogger();
  let example_file = "/home/corvo/.vim/UltiSnips/func.js";
  let TEST_CASE = [
    'console.log("Hello world");',
  ];

  Logger.info("hello world");
  const data = fs.readFileSync(example_file, "utf8");
  Logger.info(data);
  const LOG = Logger;
  eval('LOG.info("hello from func");LOG.debug("debug from func");');

  let d = eval(data);
  console.log(d);
  TEST_CASE.forEach((content: string) => {
    //   Logger.info(content);
    //   eval(data);
  });
}

if (require.main === module) {
  main();
}