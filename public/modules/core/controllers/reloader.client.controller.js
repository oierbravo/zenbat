'use strict';

angular.module('core').controller('ReloaderController', ['$scope','$http','usSpinnerService','AlertasFactory',
	function($scope,$http,usSpinnerService,AlertasFactory) {
		// Reloader controller logic
		// ...
		$scope.reload = function(){
			console.log('reloading');
			usSpinnerService.spin('cargador');
			$http.get('/reload').then(function(success){
				usSpinnerService.stop('cargador');
				AlertasFactory.show(success);

			},function(rejected){
			usSpinnerService.stop('cargador');
			console.log(reject);
				AlertasFactory.showRejected(reject);

			});
		}
	}
]);