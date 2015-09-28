'use strict';

//Articles service used for communicating with the articles REST endpoints
angular.module('componentes').factory('Componentes', ['$resource',
	function($resource) {
		return $resource('componentes/:componenteId', {
				componenteId:'@codigo'
		}, {
			update: {
				method: 'PUT'
			},
			stock: {
				method: 'GET',
				url:'componentes/:componenteId/stock',
				params:{componenteId:'@codigo'}
			},
			reloadFromFile: {
				method: 'GET',
				url:'componentes-reload'
				}
		});
		
	}
]);
