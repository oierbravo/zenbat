'use strict';
/**
 * Zenbat API server entry point.
 * Run from server/ directory: npm start
 */
var init = require('./config/init')(),
  config = require('./config/config'),
  chalk = require('chalk');

var app = require('./config/express')();

app.listen(config.port);

console.log(chalk.green('Zenbat API server started on port ' + config.port));

exports = module.exports = app;
