'use strict';

angular.module('componentes').controller('RowComponenteController', ['$scope','Componentes',
	function($scope,Componentes) {
		// Row componente controller logic
		//console.log($scope.componente);
		
		$scope.keyPressEvent = function(clickEvent){
			//console.log('KEY');
			//console.log(clickEvent.keyCode);
			if(clickEvent.keyCode === 13){
				$scope.stockPrecise();
			}
		}
		$scope.stockChange = function(id,qty){
		//	console.log($scope.componente);
			//console.log('stockChange',id);
			//console.log('stockChangeQty', parseInt($scope.stockPreciseQty));
			var nucomp = Componentes.stock({
				componenteId: id,
				qty: qty
			});
			console.log('nucomp',nucomp);
			$scope.componente = nucomp;
			$scope.revisarStock() ;
		};
		$scope.stockPrecise = function(){
			var qty = parseFloat($scope.stockPreciseQty) ;
			var nucomp = Componentes.stock({
				componenteId: $scope.componente.codigo,
				qty: qty ? qty : 0
			});
			//console.log('nucomp',nucomp);
			$scope.componente = nucomp;
			$scope.stockPreciseQty = 0;
			$scope.revisarStock() ;
		}
		$scope.stockPreciseMinus = function(id){
			var nucomp = Componentes.stock({
				componenteId: id,
				qty: -parseFloat($scope.stockPreciseQty)
			});
			//console.log('nucomp',nucomp);
			$scope.componente = nucomp;
			$scope.revisarStock() ;
		}
		$scope.revisarStock = function(){
			var cantidad = parseFloat($scope.componente.cantidad);
			var cantidadNecesaria = parseFloat($scope.componente.cantidadReservada);
			var cantidadSeguridad = parseFloat($scope.componente.stockSeguridad);
			var usableStock = cantidad -cantidadNecesaria;
			/*if(usableStock < cantidadSeguridad){
				$scope.componente.bajoMinimos = true;
			} else {
				$scope.componente.bajoMinimos = false;
			}
			if(cantidadNecesaria > usableStock){
				$scope.componente.falta = true;
			} else {
				$scope.componente.falta = false;
			}*/
		}
		$scope.revisarStock() ;
	}
]);