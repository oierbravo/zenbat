'use strict';

// Armarios module config
angular.module('armarios').run(['Menus',
	function(Menus) {
		Menus.addMenuItem('topbar', 'Armarios', 'armarios', 'armarios', '/armarios');	
	}
]);