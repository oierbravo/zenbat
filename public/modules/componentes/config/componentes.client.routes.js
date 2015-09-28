'use strict';

// Setting up route
angular.module('componentes').config(['$stateProvider',
	function($stateProvider) {
		// Articles state routing
		$stateProvider.
		state('importar-componentes', {
			url: '/importar-componentes',
			templateUrl: 'modules/componentes/views/importar-componentes.client.view.html'
		}).
		state('listComponentes', {
			url: '/componentes',
			templateUrl: 'modules/componentes/views/list-componentes.client.view.html'
		}).
		state('exportComponentes', {
			url: '/export-componentes',
			templateUrl: 'modules/componentes/views/list-componente.client.view.html'
		}).
		state('viewComponente', {
			url: '/componentes/:componenteId',
			templateUrl: 'modules/componentes/views/view-componente.client.view.html'
		}).
		state('stock', {
			url: '/stock',
			templateUrl: 'modules/componentes/views/list-stock.client.view.html'
		}).
		state('componentes-reload', {
			url: '/componentes-reload',
			templateUrl: 'modules/componentes/views/reload-from-file.client.view.html'
		});
	}
]);