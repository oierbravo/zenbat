'use strict';

/**
 * Module dependencies.
 */
	var componentes = require('../../app/controllers/componentes.server.controller'),
	database = require('../../app/controllers/database.server.controller');
var _ = require('lodash');


var json2xls = require('json2xls');
var moment = require('moment');

module.exports = function(app) {

	app.route('/stock')
		.get(componentes.list);
	app.route('/componentes')
		.get(componentes.list);

	app.route('/componentes/:componenteId')
		.get(componentes.read);
	
	app.route('/componentes/:componenteId/verificar')
		.get(componentes.read);
	app.route('/componentes/:componenteId/stock')
		.get(database.stock);
	app.route('/importar-componentes')
		.get(componentes.importarComponentes);
		
    
	app.use(json2xls.middleware);
	app.get('/export-componentes',function(req,res) {
		//console.log(res);
	   
	   var componentesJSON = database.componentesToJson();
	   //console.log(componentesJSON);
	   var options = {
	   		fields:{
	   			cantidadReal: 'string',
		   		codigo:'string',
		   		denominacion:'string',
		   		stockSeguridad: 'number',
		   		cantidad:'number',
		   		cantidadReservada: 'number'
		   	}
	   };
	   
	   /*var fields = ['cantidadReal','codigo','denominacion','stockSeguridad','cantidad','cantidadReservada'];
	   var options = {
	   		fields:fields
		   	};*/
		   	 var fecha = moment().format('DD-MM-YYYY');
    	res.xls('export-componentes_' + fecha + '.xlsx',componentesJSON,options);
	   
	  
	});


	// Finish by binding the article middleware
	app.param('componenteId', database.getComponenteById);
};