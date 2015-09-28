'use strict';

angular.module('armario-generator').controller('ArmarioGeneratorController', ['$scope',
	function($scope) {
		// Armario generator controller logic
	}
]);
function s2ab(s) {
  var buf = new ArrayBuffer(s.length);
  var view = new Uint8Array(buf);
  for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
  return buf;
}
angular.module('armario-generator').controller('ArmarioGeneratorFormController', ['$scope','$http','AlertasFactory',
	function($scope,$http,AlertasFactory) {
		$scope.exportable = false;
		$scope.generarTree = function(){
			var lastLevel = 1;
			var lastCodigo = '';
			$scope.componentes = [];
			$scope.copypaster.forEach(function(element,index){
				var splitted = element.split(' ');
				var level = splitted.splice(0,1).join();
				var tipo = splitted.splice(0,1).join();
				var codigo = splitted.splice(0,1).join();
				var jasoPone = splitted[splitted.length -1];
				var componente = {
					level:level
					,tipo:tipo
					,'Codigo Material': codigo
					,codigo: codigo
					,jasoPone: jasoPone
					,'Precio Unitario': 0
					,'Precio total': 0
				}
				var typeIndex = -1;
				if(componente.tipo === 'M'){
					typeIndex = splitted.indexOf('M');
					if(typeIndex === -1){
						typeIndex = splitted.indexOf('M2');
					}
					componente.cantidad = splitted[typeIndex -1];
				} else {
					typeIndex = splitted.indexOf('UN');
				}
				var cantidad =  splitted[typeIndex -1];
				componente['Cantidad'] =cantidad
				componente.cantidad = cantidad;
				var b = splitted.splice(typeIndex - 1);
				var denominacion = splitted.join(' ');
				if(componente.jasoPone === "Sí" || componente.jasoPone === "Parcial" ){
					componente.exportar = false;
				} else {
					componente.exportar = true;
				}
				componente['Denominación'] = denominacion;
				componente.denominacion = denominacion;
				$scope.componentes.push(componente);
				$scope.exportable = true;
			});
		
		};
		$scope.generarFile = function(){
			console.log('generarFile', $scope.nombreArchivo)
			var nombreArchivo = $scope.nombreArchivo;
			if(!nombreArchivo){
				nombreArchivo = "armario-generado-" + Date.now();
			}
			var componentes = _.filter($scope.componentes, 'exportar')
			var output = {
				nombreArchivo:nombreArchivo,
				componentes:componentes
			}
			$http.post('/generar-armario', output).success(function(data){
				$scope.downloadable = true;
				var loc='/generar-armario/' + nombreArchivo;
				window.open(loc);
   			});
		};
	}
]);