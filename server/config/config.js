'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	glob = require('glob');
var path = require('path');
/**
 * Load app configurations
 */
var config;
if (process.env.NODE_ENV === 'development') {
	config = _.extend(
		require('./env/all'),
		require('./env/development') || {}
	);
} else {
	config = _.extend(
		require('./env/all'),
		require('./env/production') || {}
	);
}
// Project root (repo root) so asset globs resolve when server runs from server/
config.appRoot = path.join(__dirname, '..', '..');
module.exports = config;





/**
 * Get files by glob patterns
 */
module.exports.getGlobbedFiles = function(globPatterns, removeRoot) {
	// For context switching
	var _this = this;

	// URL paths regex
	var urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

	// The output array
	var output = [];

	// If glob pattern is array so we use each pattern in a recursive way, otherwise we use glob 
	if (_.isArray(globPatterns)) {
		globPatterns.forEach(function(globPattern) {
			output = _.union(output, _this.getGlobbedFiles(globPattern, removeRoot));
		});
	} else if (_.isString(globPatterns)) {
		if (urlRegex.test(globPatterns)) {
			output.push(globPatterns);
		} else {
			var cwd = this.appRoot || process.cwd();
			var files = glob.sync(globPatterns, { cwd: cwd });
			if (removeRoot) {
				files = files.map(function(file) {
					return file.replace(removeRoot, '');
				});
			}
			output = _.union(output, files);
		}
	}
	return output;
};

/**
 * Get the modules JavaScript files
 */
module.exports.getJavaScriptAssets = function(includeTests) {
	var output = this.getGlobbedFiles(this.assets.lib.js.concat(this.assets.js), 'public/');

	// To include tests
	if (includeTests) {
		output = _.union(output, this.getGlobbedFiles(this.assets.tests));
	}

	return output;
};

/**
 * Get the modules CSS files
 */
module.exports.getCSSAssets = function() {
	var output = this.getGlobbedFiles(this.assets.lib.css.concat(this.assets.css), 'public/');
	return output;
};