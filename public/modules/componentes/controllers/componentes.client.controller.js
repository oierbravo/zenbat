'use strict';


angular.module('componentes').controller('ComponentesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Componentes','usSpinnerService','AlertasFactory',
	function($scope, $stateParams, $location, Authentication, Componentes,usSpinnerService,AlertasFactory) {
		$scope.authentication = Authentication;

 		$scope.searchString   = '';     // set the default search/filter term

 		$scope.predicate = 'row'; // set the default sort type
        $scope.reverse = false;  // set the default sort order
		//console.log($scope); 
		$scope.cargandoComps = true;
		$scope.compsCargados = false;

		$scope.showBajoMinimos = true;
		$scope.showNegatibos = true;
		$scope.showOk = false;

		$scope.toggleBajoMinimos = function(){
			$scope.showBajoMinimos = !$scope.showBajoMinimos;
		}
		$scope.toggleNegatibos = function(){
			$scope.showNegatibos = !$scope.showNegatibos;
		}
		$scope.toggleOk = function(){
			$scope.showOk = !$scope.showOk;
		}
 		$scope.order = function(predicate) {
        	$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
       	 	$scope.predicate = predicate;
        };


		$scope.reloadFromFile = function(){
			usSpinnerService.spin('cargador');
			$scope.reloaded = Componentes.reloadFromFile().$promise.then(function(data){
				usSpinnerService.stop('cargador');
				AlertasFactory.show(data);
				console.log(data);
			},function(reject){
				usSpinnerService.stop('cargador');
			console.log(reject);
				AlertasFactory.showRejected(reject);
			});
		}
	
		$scope.find = function() {
			$scope.compsCargados = false;
			$scope.cargandoComps = true;
			 usSpinnerService.spin('cargador');
			$scope.componentes = Componentes.query().$promise.then(function(data){
				$scope.componentes = data;
				$scope.compsCargados = true;
				console.log(data);
				usSpinnerService.stop('cargador');
			},function(reject){
				usSpinnerService.stop('cargador');
		
				AlertasFactory.showRejected(reject);
				
			});
		};

		$scope.findOne = function() {

			$scope.componente = Componentes.get({

				componenteId: $stateParams.componenteId
			},function (componente){
				console.log(componente);
			});
		};
		$scope.changeStock = function() {
			var componente = $scope.componente;
		

			$scope.componente = Componentes.get({

				componenteId: $stateParams.componenteId
			},function (componente){

			});
		};
	}
]);