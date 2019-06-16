import { Logger } from "./logger";

const VIM_SNIPPET = /^snippet ([^\s]*)\s*(?:"(.*?)".*)?\n((?:.|\n)*?)\nendsnippet$/gm;

function parse(rawSnippets: string): Object {
  let res = null;
  let snippets = {};
  Logger.debug(rawSnippets);
  while ((res = VIM_SNIPPET.exec(rawSnippets)) !== null) {
    //eslint-disable-next-line no-unused-vars
    const [_, prefix, description, body] = res;
    Logger.debug("prefix: ", prefix);
    Logger.debug("description: ", description);
    Logger.debug("body: ", body);
    // Logger.debug("body after normalize: ", normalizePlaceholders(body));

    // snippets[prefix] = {
    //   prefix,
    //   body: normalizePlaceholders(body)
    // };
    // if (description) {
    //   snippets[prefix].description = description;
    // }
  }
  return snippets;
}

// function normalizePlaceholders(str) {
//   const visualPlaceholder = /\${(\d):\${VISUAL}}/;
//   if (visualPlaceholder.test(str)) {
//     const n = visualPlaceholder.exec(str)[1];
//     return str.replace(visualPlaceholder, `$${n}`);
//   } else {
//     return str;
//   }
// }

// module.exports = {
//   parse
// };
export { parse };
(function main() {
  let txt = `snippet gitig "Git add will ignore this"
####### XXX: Can't GIT add [START] #########
$1
####### XXX: Can't GIT add  [END]  #########
endsnippet
`;
  Logger.debug(parse(txt));
})();
