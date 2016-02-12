'use strict';

// Configuring the Articles module
angular.module('pedidos').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Pedidos Clientes', 'pedidos', 'pedidos', '/pedidos');
	}
]);