'use strict';

//Articles service used for communicating with the articles REST endpoints
angular.module('historial').factory('Historial', ['$resource',
	function($resource) {
		return $resource('historial/:categoria', {
				categoria:'@categoria'
		}, {
			
		});
		
	}
]);
