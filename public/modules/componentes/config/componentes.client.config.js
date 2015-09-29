'use strict';

// Configuring the Articles module
angular.module('componentes').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Componentes', 'componentes', 'componentes', '/componentes');
		//Menus.addSubMenuItem('topbar', 'componentes', 'Ver componentes', 'componentes');
		Menus.addSubMenuItem('topbar', 'componentes', 'Importar', '/importar-componentes');
		Menus.addMenuItem('topbar', 'Stock', 'stock', '/stock');

		Menus.addMenuItem('topbar', 'Recargar', 'reload', 'reload', '/reload');
		
	}
]);