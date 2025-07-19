const readline = require("readline");

module.exports = function (source) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("按回车退出程序...", () => {
    rl.close();
  });
  return source;
};
