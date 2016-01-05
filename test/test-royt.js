var main = require("../main");
var timers = require("sdk/timers");
var pageWorker;

exports.testRun = function(assert, done) {
	timers.setTimeout(function() {
		pageWorker = main.getPageWorker();
		assert.ok(typeof pageWorker !== "undefined", "content script is attached");
		done();
	}, 10000);
}

require("sdk/test").run(exports);