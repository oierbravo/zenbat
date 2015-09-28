'use strict';

// Pedidos proveedores module config
angular.module('pedidos-proveedores').run(['Menus',
	function(Menus) {
		Menus.addMenuItem('topbar', 'Pedidos Proveedores', 'pedidos-proveedores', 'pedidos-proveedores', '/pedidos-proveedores');
	}
]);