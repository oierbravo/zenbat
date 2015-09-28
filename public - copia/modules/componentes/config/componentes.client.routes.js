'use strict';

// Setting up route
angular.module('componentes').config(['$stateProvider',
	function($stateProvider) {
		// Articles state routing
		$stateProvider.
		state('listComponentes', {
			url: '/componentes',
			templateUrl: 'modules/componentes/views/list-componentes.client.view.html'
		}).
		state('createComponente', {
			url: '/componentes/create',
			templateUrl: 'modules/componentes/views/create-componente.client.view.html'
		}).
		state('viewComponente', {
			url: '/componentes/:componenteId',
			templateUrl: 'modules/componentes/views/view-componente.client.view.html'
		}).
		state('editComponente', {
			url: '/componentes/:componenteId/edit',
			templateUrl: 'modules/componentes/views/edit-componente.client.view.html'
		}).
		
		state('stock', {
			url: '/stock',
			templateUrl: 'modules/componentes/views/list-stock.client.view.html'
		});
	}
]);