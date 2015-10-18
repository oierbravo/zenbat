'use strict';

module.exports = function(app) {
		var proveedores = require('../../app/controllers/proveedores.server.controller');
	
	// Pedidos Routes
	app.route('/proveedores')
		.get(proveedores.listProveedores);
	app.route('/proveedores/:proveedorId')
		.get(proveedores.readProveedor);
	app.param('proveedorId', proveedores.proveedorById);

	// Pedidos Routes
	app.route('/almacenes')
		.get(proveedores.listAlmacenes);
	app.route('/almacenes/:almacenId')
		.get(proveedores.readAlmacen);
	app.param('almacenId', proveedores.almacenById);

};