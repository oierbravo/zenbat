'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    _ = require('lodash');
var moment = require('moment');

var Componentes = require('./componentes.server.controller.js');
var Proveedores = require('./proveedores.server.controller.js');

var errorHandler = require('./errors.server.controller');

var cache = require('memory-cache');
var zenbatConfig = require('../../zenbat.config.js');


var flatfile = require('flat-file-db');
var dbPedidosProveedores = flatfile.sync(zenbatConfig.basePath + zenbatConfig.pedidosProveedores.dbFile);
var dbPedidosProveedoresComponentes = flatfile.sync(zenbatConfig.basePath + zenbatConfig.pedidosProveedores.dbFile);



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
var pedidosProveedoresComponente = dbPedidosProveedoresComponentes.get(componenteId);
		if(!pedidosProveedoresComponente){
			pedidosProveedoresComponente = [];
	}
	var index = _.findIndex(pedidosProveedoresComponente,{pedidoProveedorId:pedidoProveedorId});
		if(index > 0){
			//found, update
			pedidosProveedoresComponente[index] = {pedidoProveedorId:pedidoProveedorId,qty:qty};
		} else {
			//no found, add
			dbPedidosProveedoresComponentes.push({pedidoId:pedidoId,qty:qty});
	}
	
	dbPedidosProveedoresComponentes.put(componenteId,pedidosComponente);
}

function getPedidodProveedoresComponente(componenteId){
	return dbPedidosProveedoresComponentes.get(componenteId);;
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
	var pedidoProveedor = loadById(id);
	console.log('pedidoProveedorByID-id',id);
	//console.log('pedidoProveedorByID-pedidoProveedor',pedidoProveedor);
	if(!pedidoProveedor){
		return res.status(404).send('Pedido no encontrado'
				);		
	}	else {
		req.pedidoProveedor = pedidoProveedor;
	}
	next();
};
/**
 * Create a Pedidos proveedore
 */
exports.create = function(req, res) {
	//console.log(req.body);
	var pedido = req.body;
	pedido.pedidoProveedorId = pedido.nPedido;
	dbPedidosProveedores.put(pedido.pedidoProveedorId,pedido,pedido.qty);
	pedido = preparePedidoProveedorData(pedido);
	console.log(pedido);
	res.json(pedido);

};

/**
 * Show the current Pedidos proveedore
 */
exports.read = function(req, res) {
	console.log('Pedidos proveedores Read');
	res.json(req.pedidoProveedor);
};

/**
 * Update a Pedidos proveedore
 */
exports.update = function(req, res) {
	console.log('updating')
	var pedidoProveedor = req.pedidoProveedor;

	pedidoProveedor = _.extend(pedidoProveedor, req.body);

	dbPedidosProveedores.put(pedidoProveedor.pedidoProveedorId,pedidoProveedor);
	res.json(pedidoProveedor);
};

/**
 * Delete an Pedidos proveedore
 */
exports.delete = function(req, res) {
	//console.log('req.params.pedidoProveedorId',req.params.pedidoProveedorId);
	//console.log('req.pedidoProveedor',req.pedidoProveedor);
	//console.log('Deleting ' + req.pedidoProveedor.nPedido);
	dbPedidosProveedores.del(req.pedidoProveedor.nPedido);
	res.status(200).send({message:"Deleted " + req.pedidoProveedor.nPedido});
};

/**
 * List of Pedidos proveedores
 */
exports.list = function(req, res) {
	//loadComponentes();
	//Pedidos.loadPedidos();
	//if(_.isEmpty(exports.pedidosProveedores)){
		loadPedidosProveedores();
//	}
	//console.log(exports.pedidosProveedores);
	res.jsonp(exports.pedidosProveedores );
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

