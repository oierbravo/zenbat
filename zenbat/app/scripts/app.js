'use strict';

/**
 * @ngdoc overview
 * @name zenbatApp
 * @description
 * # zenbatApp
 *
 * Main module of the application.
 */
angular
  .module('zenbatApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/gauzak', {
        templateUrl: 'views/pieza.html',
        controller: 'PiezaCtrl',
        controllerAs: 'pieza'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
