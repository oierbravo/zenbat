'use strict';

// Configuring the Articles module
angular.module('pedidos').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		//Menus.addMenuItem('topbar', 'Pedidos', 'pedidos', 'dropdown', '/pedidos(/create)?');
		
		Menus.addMenuItem('topbar', 'Pedidos', 'pedidos', 'pedidos', '/pedidos');
		//Menus.addSubMenuItem('topbar', 'pedidos', 'List Pedidos', 'pedidos');
		//Menus.addSubMenuItem('topbar', 'pedidos', 'New Pedido', 'pedidos/create');
	}
]);