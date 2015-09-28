'use strict';

angular.module('armarios').factory('Armarios', ['$resource',
	function($resource) {
	/*	$resource('armarios/:armarioId/verificar', {
				armarioId:'@id'
		}, {
			verificar: {
				method: 'GET'
			}
			
		});
*/
		return $resource('armarios/:armarioId', {
				armarioId:'@id'
		}, {
			update: {
				method: 'PUT'
			},
			verificar: {
				method: 'GET',
				url:'armarios/:armarioId/verificar',
				params:{armarioId:'@id'}
			},
			entregar: {
				method: 'GET',
				url:'armarios/:armarioId/entregar',
				params:{armarioId:'@id'}
			}
		});
	}
]);