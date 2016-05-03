'use strict';

angular.module('core').filter('css', [
	function() {
		return function(input) {
			// Css directive logic
			// ...
			return input.replace(/ /g,'-').toLowerCase();
		
		};
	}
]);