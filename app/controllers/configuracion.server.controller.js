'use strict';

/**
 * Module dependencies.
 */
/*var mongoose = require('mongoose'),*/
    _ = require('lodash');
	var path = require('path');

var cache = require('memory-cache');
var zenbatConfig = require('../../zenbat.config.js');


var flatfile = require('flat-file-db');
var dbConfig = flatfile.sync(zenbatConfig.basePath + zenbatConfig.config.dbFile);

function loadConfig(){
	var keys = dbConfig.keys();
	keys.forEach(function(element,index){
		exports.variables[element] = dbConfig.get(element);
	});
}

exports.getVariable = function(key){
	if(_.isUndefined(exports.variables)){
		exports.variables = [];
		loadConfig();
	}
	return variable[key];
}

exports.setVariable = function(key,value){
	if(_.isUndefined(exports.variables)){
		exports.varibles = [];
	}
	exports.variables[key] = value;
	dbConfig.put(key,value);

}