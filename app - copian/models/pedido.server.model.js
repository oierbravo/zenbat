'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Pedido Schema
 */
var PedidoSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Pedido name',
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Pedido', PedidoSchema);