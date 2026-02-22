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

	res.render('index', {
		user: req.user || null,
		request: req
	});
};

