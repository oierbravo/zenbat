'use strict';

angular.module('proveedores').factory('Proveedores', ['$resource',
	function($resource) {
		return $resource('proveedores/:proveedorId', {
				proveedorId:'@proveedorId'
		}, {
			getAll: {
				method: 'GET',
				isArray : true,
				url:'proveedores'
			}
			

		});
	}
]).factory('Almacenes', ['$resource',
	function($resource) {
		return $resource('almacenes/:almacenId', {
				almacenId:'@almacenId'
		}, {
			getAll: {
				method: 'GET',
				isArray : true,
				url:'almacenes'
			}
			

		});
	}
]);