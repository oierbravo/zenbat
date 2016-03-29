'use strict';

//Setting up route
angular.module('historial').config(['$stateProvider',
	function($stateProvider) {
		// Armarios state routing
		$stateProvider.
		state('historial', {
			url: '/historial',
			templateUrl: 'modules/historial/views/list-historial.client.view.html'
		});
		
	}
]);