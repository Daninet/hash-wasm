const { md5 } = require("../../dist/index.umd");

async function run() {
	console.log("Result: ", await md5("a"));
}

run();
