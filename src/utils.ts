/**
 * str (string): TODO
 * ch (string[]): TODO
 * Returns: TODO
 *
 * Copy from: https://stackoverflow.com/a/55292366
 *  trimAny('|hello|world   ', [ '|', ' ' ]); // => 'hello|world'
 *  because '.indexOf' is used, you could also pass a string for the 2nd parameter:
 *  trimAny('|hello| world  ', '| '); // => 'hello|world'
 */
function trim(str: string, ch: string[]) {
  let start = 0;
  let end = str.length;

  while (start < end && ch.indexOf(str[start]) >= 0) {
    ++start;
  }

  while (end > start && ch.indexOf(str[end - 1]) >= 0) {
    --end;
  }

  return start > 0 || end < str.length ? str.substring(start, end) : str;
}

function trimLeft(str: string, ch: string[]) {
  let start = 0;
  let end = str.length;
  while (start < end && ch.indexOf(str[start]) >= 0) {
    ++start;
  }

  return start > 0 || end < str.length ? str.substring(start, end) : str;
}

function trimRight(str: string, ch: string[]) {
  let start = 0;
  let end = str.length;
  while (end > start && ch.indexOf(str[end - 1]) >= 0) {
    --end;
  }
  return start > 0 || end < str.length ? str.substring(start, end) : str;
}
export { trim, trimLeft, trimRight };
