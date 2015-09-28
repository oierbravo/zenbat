'use strict';

angular.module('componentes').directive('ngEnter', [
	function() {
		console.log('ENTER');
		return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
 
                event.preventDefault();
            }
        });
    };
	}
]);