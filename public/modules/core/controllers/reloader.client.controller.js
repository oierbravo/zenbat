'use strict';

angular.module('core').controller('ReloaderController', ['$scope','$http','usSpinnerService','AlertasFactory',
	function($scope,$http,usSpinnerService,AlertasFactory) {
		// Reloader controller logic
		// ...
		$scope.reload = function(){
			console.log('reloading');
			usSpinnerService.spin('cargador');
			$http.get('/reload-cli').then(function(success){
				usSpinnerService.stop('cargador');
				console.log(success);
				AlertasFactory.show({message:success.data.message,type:'success'});

			},function(rejected){
			usSpinnerService.stop('cargador');
			console.log(rejected);
				AlertasFactory.showRejected(rejected);

			});
		}
	}
]);