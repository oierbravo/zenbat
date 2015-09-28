'use strict';

// Configuring the Articles module
angular.module('componentes').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Componentes', 'componentes', 'componentes', '/componentes');
		Menus.addMenuItem('topbar', 'Stock', 'stock', '/stock');
		//Menus.addSubMenuItem('topbar', 'componentes', 'List componentes', 'componentes');
		//Menus.addSubMenuItem('topbar', 'componentes', 'New componente', 'componentes/create');
	}
]);