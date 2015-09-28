'use strict';

/**
 * Module dependencies.
 */
var Armarios = require('./armarios.server.controller.js');
var Componentes = require('./componentes.server.controller.js');
var Pedidos = require('./pedidos.server.controller.js');

exports.index = function(req, res) {
	res.render('index', {
		user: req.user || null,
		request: req
	});
};
exports.reload = function(req, res){
	Componentes.reload();
	Armarios.reload();
	Pedidos.reload();

	res.render('index', {
		user: req.user || null,
		request: req
	});
}