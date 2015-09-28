'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;


var ComponenteSchema = new Schema({
	nProducto: {
		type: String,
		default: '',
		trim: true,
		required: 'Nº producto necesario'
	},
	name: {
		type: String,
		default: '',
		trim: true,
		required: 'El nombre no puede estar en blanco'
	},
	notes: {
		type: String,
		default: '',
		trim: true
	},
	jasoPone: {
		type: Boolean,
		default: false
	},
	qty: {
		type: Number,
		default: 0,
		trim: true
	},
	qtyReserv: {
		type: Number,
		default: 0,
		trim: true
	},
	provider: {
		type: String,
		default: '',
		trim: true
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Componente', ComponenteSchema);