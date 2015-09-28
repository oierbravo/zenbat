'use strict';

// Armarios module config
angular.module('armarios').run(['Menus',
	function(Menus) {

		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Armarios', 'armarios', 'armarios', '/armarios');
	//	Menus.addSubMenuItem('topbar', 'armarios', 'List armarios', 'armarios');
	
	
	}
]);