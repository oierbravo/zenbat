'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init')(),
	config = require('./config/config'),
	//mongoose = require('mongoose'),
	chalk = require('chalk');
//var EventLogger = require('node-windows').EventLogger;
//var log = new EventLogger('Zenbat');


/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Bootstrap db connection
/* var db = mongoose.connect(config.db, function(err) {
	if (err) {
		console.error(chalk.red('Could not connect to MongoDB!'));
		console.log(chalk.red(err));
	}
}); */

// Init the express application
// var app = require('./config/express')(db);
var app = require('./config/express')();

// Bootstrap passport config
//require('./config/passport')();


// Start the app by listening on <port>
app.listen(config.port);

// Expose app
exports = module.exports = app;


// Logging initialization
console.log('MEAN.JS application started on port ' + config.port);
console.log(process.cwd());