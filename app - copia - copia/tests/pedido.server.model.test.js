'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Pedido = mongoose.model('Pedido');

/**
 * Globals
 */
var user, pedido;
