'use strict';

//Setting up route
angular.module('armario-generator').config(['$stateProvider',
	function($stateProvider) {
		// Armario generator state routing
		$stateProvider.
		state('generar-armario', {
			url: '/generar-armario',
			templateUrl: 'modules/armario-generator/views/generator-form.client.view.html'
		});
	}
]);