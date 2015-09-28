'use strict';

angular.module('componentes').controller('ComponentesImporterController', ['$scope', 'Upload','AlertasFactory','$window',
	function($scope,Upload,AlertasFactory,$window) {
//console.log(Upload);
$scope.percent = 0;
$scope.alerts = [];
		  $scope.submit = function() {
		  	console.log('submit');
		      if (form.file.$valid && $scope.file && !$scope.file.$error) {
		        $scope.upload($scope.file);
		      }
   		 };

    // upload on file select or drop
    $scope.upload = function (file) {
    		console.log('upload');
    		//console.log(file);
    		$scope.uploadComplete = false;
    		$scope.uploadFail = false;
    		$scope.percent = 0;
        Upload.upload({
            url: '/import/archivo',
            fields: {'username': $scope.username},
            file: file
        }).progress(function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
            $scope.percent = progressPercentage;

        }).success(function (data, status, headers, config) {
            console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
            $scope.uploadComplete = true;
            //$scope.alerts.push({type:'success',msg:'Subida realizada.'});
            AlertasFactory.show({type:'success',message:'Subida realizada.'});
           // $window.location.href = '/';
        }).error(function (data, status, headers, config) {
            console.log('error status: ' + status);
            $scope.uploadFail = false;
            //$scope.alerts.push({type:'danger',msg:'Fallo en la subida.'});
            AlertasFactory.show({type:'danger',message:'Fallo en la subida.'});
        })
    };
	}
]);