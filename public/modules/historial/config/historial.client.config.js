'use strict';

// Armarios module config
angular.module('historial').run(['Menus',
	function(Menus) {
		Menus.addMenuItem('topbar', 'Historial', 'historial', 'historial', '/historial');	
	}
]);