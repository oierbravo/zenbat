'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	
	_ = require('lodash');

require('array.prototype.find');
var XLSX = require('xlsx');
var cache = require('memory-cache');
var Pedidos =  require('./pedidos.server.controller');
var PedidosProveedores =  require('./pedidos-proveedores.server.controller');

//var cache = require('memory-cache');
var zenbatConfig = require('../../zenbat.config.js');

var flatfile = require('flat-file-db');
var dbProductos = flatfile.sync(zenbatConfig.basePath + 'db\\productos.db');

var headerProductos = zenbatConfig.componentes.header;
var headerStock = zenbatConfig.stock.header;
	var json2xls = require('json2xls');

exports.componentesArray = [];
exports.componentes = [];

exports.workbook = '';

exports.componentesReservados = [];

var reloadComponentes = true;
var fileProductosChanged = true;
var firstLoad = true;
exports.xlsKeys = [];

/**
 * List of Articles
 */
exports.list = function(req, res) {
	//console.log(req.app.pedidosProveedores);
	//console.log(req.app.locals);
	//console.log('req.app.locals.database.componentes',req.app.locals.database.componentes);
	//req.app.locals.database.calculos();
	res.jsonp(req.app.locals.database.componentes)
};


/**
 * Article authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.componente.user.id !== req.user.id) {
		return res.status(403).send({
			message: 'User is not authorized'
		});
	}
	next();
};
/**
 * Article middleware
 */
exports.componenteByID = function(req, res, next, id) {
	var componente = getComponenteById(id);
	if(!componente){
		return res.status(404).send({
					message: 'Componente not found'
				});		
	}	
	req.componente = componente;
	next();
};

function deleteNonXLSComponentes(){
	var keys = dbProductos.keys();
	keys.forEach(function(element,index){
		var exists = dbProductos.has(element);
		if(existes){
			//exists, nothing to do
		} else {
			//don't exists so delete.
			dbProductos.del(element);
		}
	});
}

exports.verificarStock = function(id,qty,pedidoId){
	var componente = getComponenteById(id);
	console.log('verificarStock',componente);
	}

/**
 * Show the current componente
 */

exports.stock = function(req, res) {
	req.app.locals.database.stock(req,res);
};
/**
 * Show the current componente
 */
exports.read = function(req, res) {
	//console.log(req.params);
	//var index = _.findIndex(req.app.locals.database.componentes, { 'codigo': req.params.componenteId });
	//var componente = req.app.locals.database.getComponente(req.params.componenteId);
	//res.json(req.componente);
	//req.app.locals.database.calculos();
	res.json(req.componente);
};


exports.componentesToJson = function(req,res){
	var componentes = getComponentes();
//	loadComponentes();
	//Pedidos.loadPedidos();
	var output = [];
	exports.componentes = output;
	componentes.forEach(function(element,index){
		element.cantidadReal = ' ';
		exports.componentes[index] = element;
	});
	return exports.componentes;	
}

exports.importarComponentes = function(req,res){
	console.log('Import screen');
}