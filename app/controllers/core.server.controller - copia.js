'use strict';

/**
 * Module dependencies.
 */
var Armarios = require('./armarios.server.controller.js');
var Componentes = require('./componentes.server.controller.js');
var Pedidos = require('./pedidos.server.controller.js');
var PedidosProveedores =  require('./pedidos-proveedores.server.controller');

var cache = require('memory-cache');

exports.index = function(req, res) {
	Pedidos.load();
	PedidosProveedores.load();
	Componentes.load();
	res.render('index', {
		user: req.user || null,
		request: req
	});
};
exports.reloadold = function(req, res){
	Componentes.reload();
	Armarios.reload();
	Pedidos.reload();

	res.render('index', {
		user: req.user || null,
		request: req
	});
}
exports.reload = function(req, res){
	//console.log("reloading all");
	//Pedidos.load();
	//PedidosProveedores.load();
	//Componentes.load();
	res.status(200);
	//res.status(200);
	//res.send({message:'Todos cargadao'});
	
}
exports.reloadCli = function(req, res){
	console.log("reloading all");
	var pedidos = Pedidos.load()
	var numPedidos = pedidos.length;
	var numPedidosProveedores = PedidosProveedores.load();
	var componentes = Componentes.load();
	var numComponentes.length;


	res.status(200);
	var str ='Cargados: ' + numComponentes + ' componentes, ' + numPedidos + ' pedidos y ' + numPedidosProveedores +' pedidos a proveedores.';
	var componentesKeys = cache.get('componentes-keys');
	res.send({message:str,componentesKeys:componentesKeys});
	
}