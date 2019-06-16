import * as assert from "assert";
import { parse } from "../parse";

suite("Parser Tests", function() {
  test("Somethins 1", function() {
    parse("hello world");
  });
});