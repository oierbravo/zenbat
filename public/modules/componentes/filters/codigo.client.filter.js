'use strict';

angular.module('componentes').filter('codigo', [
	function() {
		return function(input) {
			// Codigo directive logic
			// ...
		//	'<a href="/#!/componentes/' {{componente.codigo}}">{{componente.codigo}}</a>
			return 'codigo filter: ' + input;
		};
	}
]);