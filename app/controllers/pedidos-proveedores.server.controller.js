'use strict';

/**
 * Module dependencies.
 */
//var mongoose = require('mongoose'),
  var  _ = require('lodash');
var moment = require('moment');

var Componentes = require('./componentes.server.controller.js');
var Proveedores = require('./proveedores.server.controller.js');

var errorHandler = require('./errors.server.controller');

var cache = require('memory-cache');
var zenbatConfig = require(__dirname + '/zenbat.config.js');


var flatfile = require('flat-file-db');
var dbPedidosProveedores = flatfile.sync(zenbatConfig.basePath + zenbatConfig.pedidosProveedores.dbFile);
var dbPedidosProveedoresComponentes = flatfile.sync(zenbatConfig.basePath + zenbatConfig.pedidosProveedores.dbFile);
var cachePedidosComponente = cache;


exports.pedidosProveedores = [];



function loadPedidosProveedores(){
	exports.pedidosProveedores = [];
	var keys = dbPedidosProveedores.keys();
	keys.forEach(function(element,index){
		var pedido = dbPedidosProveedores.get(element);

		pedido.componentes.forEach(function(element,index){
			Componentes.setPedidoProveedor(element,pedido.pedidoProveedorId,pedido.qty);	
		});
		
		exports.pedidosProveedores.push(pedido);
	});
	return exports.pedidosProveedores;
	
}
function setPedidodProveedoresComponente(pedidoProveedorId,pedidoId){
//var pedidosProveedoresComponente = dbPedidosProveedoresComponentes.get(componenteId);
var pedidosProveedoresComponente = cachePedidosComponente.get(componenteId + '-pedidosProveedores');
		if(!pedidosProveedoresComponente){
			pedidosProveedoresComponente = [];
	}
	var index = _.findIndex(pedidosProveedoresComponente,{pedidoProveedorId:pedidoProveedorId});
		if(index > 0){
			//found, update
			pedidosProveedoresComponente[index] = {pedidoProveedorId:pedidoProveedorId,qty:qty};
		} else {
			//no found, add

			pedidosProveedoresComponente.push({pedidoId:pedidoId,qty:qty});
	}
	cachePedidosComponente.put(componenteId + '-pedidosProveedores',pedidosProveedoresComponente);
	//dbPedidosProveedoresComponentes.put(componenteId,pedidosComponente);
}

function getPedidodProveedoresComponente(componenteId){
	return cachePedidosComponente.get(componenteId + '-pedidosProveedores');
	///return dbPedidosProveedoresComponentes.get(componenteId);;
}


function loadById(id){
	console.log('loadById-id',id);
	var pedido = dbPedidosProveedores.get(id);
	if(pedido){
		
		pedido = preparePedidoProveedorData(pedido);
		console.log(pedido);
		return pedido;
	} else {
		return false;
	}


}
function preparePedidoProveedorData(pedidoProveedor){
	var proveedorData = Proveedores.getProveedorById(pedidoProveedor.proveedor);
		pedidoProveedor.proveedorData = proveedorData;

		var almacenData = Proveedores.getAlmacenById(pedidoProveedor.almacen);
		pedidoProveedor.almacenData = almacenData;
		if(_.isEmpty(pedidoProveedor.componentes)){
			pedidoProveedor.componentes = [];
		}
		
		return pedidoProveedor;
}
exports.pedidoProveedorByID = function(req,res){
	res.json(req.pedidoProveedor);
}
exports.pedidoProveedorExists = function(pedidoProveedorId){
	return dbPedidosProveedores.has(pedidoProveedorId);
}
/**
 * Article middleware
 */
exports.pedidoProveedorByID = function(req, res, next, id) {
	console.log(req.app.locals.database.pedidosProveedores);
	var index = _.findIndex(req.app.locals.database.pedidosProveedores,{pedidoProveedorId:id});
	//console.log('pedProdInd',index);
	if(index > -1){
		req.pedidoProveedor = req.app.locals.database.pedidosProveedores[index];
		next();
	} else {
		return next(new Error('Failed to load Pedido ' + id));
	}


	/*var pedidoProveedor = loadById(id);
	console.log('pedidoProveedorByID-id',id);
	//console.log('pedidoProveedorByID-pedidoProveedor',pedidoProveedor);
	if(!pedidoProveedor){
		return res.status(404).send('Pedido no encontrado'
				);		
	}	else {
		req.pedidoProveedor = pedidoProveedor;
	}
	next();*/
};
/**
 * Create a Pedidos proveedore
 */
exports.create = function(req, res) {
	//console.log(req.body);
	/*var pedido = req.body;
	pedido.pedidoProveedorId = pedido.nPedido;
	dbPedidosProveedores.put(pedido.pedidoProveedorId,pedido,pedido.qty);
	pedido = preparePedidoProveedorData(pedido);
	console.log(pedido);
	res.json(pedido);*/
	req.app.locals.database.createPedidoProveedor(req,res);

};
exports.completar = function(req, res){
	req.app.locals.database.completarPedidoProveedor(req,res);
}

/**
 * Show the current Pedidos proveedore
 */
exports.read = function(req, res) {
	console.log('Pedidos proveedores Read');
	req.pedidoProveedor = preparePedidoProveedorData(req.pedidoProveedor);
	res.json(req.pedidoProveedor);
};

/**
 * Update a Pedidos proveedore
 */
exports.update = function(req, res) {
	/*console.log('updating')
	var pedidoProveedor = req.pedidoProveedor;

	pedidoProveedor = _.extend(pedidoProveedor, req.body);

	dbPedidosProveedores.put(pedidoProveedor.pedidoProveedorId,pedidoProveedor);
	res.json(pedidoProveedor);*/
	req.app.locals.database.updatePedidoProveedor(req,res);
};

/**
 * Delete an Pedidos proveedore
 */
exports.delete = function(req, res) {
	/*
	//console.log('req.params.pedidoProveedorId',req.params.pedidoProveedorId);
	//console.log('req.pedidoProveedor',req.pedidoProveedor);
	//console.log('Deleting ' + req.pedidoProveedor.nPedido);
	dbPedidosProveedores.del(req.pedidoProveedor.nPedido);
	res.status(200).send({message:"Deleted " + req.pedidoProveedor.nPedido});*/
	req.app.locals.database.deletePedidoProveedor(req,res);
};

/**
 * List of Pedidos proveedores
 */
exports.list = function(req, res) {
	//loadComponentes();
	//Pedidos.loadPedidos();
	//if(_.isEmpty(exports.pedidosProveedores)){
	//	loadPedidosProveedores();
//	}
	//console.log(req.app.locals.database.pedidosProveedores);
	res.jsonp(req.app.locals.database.pedidosProveedores );
};
/**
 * Article authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.article.user.id !== req.user.id) {
		return res.status(403).send({
			message: 'User is not authorized'
		});
	}
	next();
};
function loadPedidosProveedoresForEach(element,index){
	cache.put(element.pedidoProveedorId,element);
}
exports.load = function(){
	var pedidosProveedores = loadPedidosProveedores();
	return pedidosProveedores.length;
	//pedidosProveedores.forEach(loadPedidosProveedoresForEach);
}

