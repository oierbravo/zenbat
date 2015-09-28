'use strict';

//Setting up route
angular.module('armarios').config(['$stateProvider',
	function($stateProvider) {
		// Armarios state routing
		$stateProvider.
		state('view-armario', {
			url: '/armarios/:armarioId',
			templateUrl: 'modules/armarios/views/view-armario.client.view.html'
		}).
		state('list-armarios', {
			url: '/armarios',
			templateUrl: 'modules/armarios/views/list-armarios.client.view.html'
		});
	}
]);