'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');

exports.reservas = [];

exports.reservarComponente = function(componenteId,qty){
	if(typeof exports.reservas[componenteId] !== 'undefined'){
		exports.reservas[componenteId] += qty;
	} else {
		exports.reservar[componenteId] = qty;
	}

};