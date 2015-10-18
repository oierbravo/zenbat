'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    _ = require('lodash');

var zenbatConfig = require('../../zenbat.config.js');

//var headerProveedores = zenbatConfig.pedidosProveedores.proveedores.header;

require('array.prototype.find');
var XLSX = require('xlsx');
exports.proveedores = [];

function loadProveedores(){
	var workbook = XLSX.readFileSync(zenbatConfig.basePath + zenbatConfig.proveedores.file);

	//var sheetName = workbook.SheetNames[workbook.SheetNames.length -1];

	var proveedoresSheet = workbook.Sheets['Proveedores'];
	var proveedores = XLSX.utils.sheet_to_json(proveedoresSheet);
//console.log(proveedores);
	
	exports.proveedores = proveedores;

	exports.proveedores.forEach(function(element,index){
		//console.log(element);
		//element.proveedorId = _.camelCase(element.Nombre);
		element.ind = index;
		element.proveedorId = index;
		exports.proveedores[index] = element;
	});
	
	var almacenesSheet = workbook.Sheets['Almacenes'];
	var almacenes = XLSX.utils.sheet_to_json(almacenesSheet);
//console.log(proveedores);
	exports.almacenes = almacenes;

	exports.almacenes.forEach(function(element,index){
		//element.almacenId = _.camelCase(element.Nombre);
		element.ind = index;
		element.almacenId = index;
		exports.almacenes[index] = element;
	});
	
}

function proveedorById(id){
	if(_.isEmpty(exports.proveedores)){
		loadProveedores();
	}
	/*console.log('exports.proveedores',exports.proveedores);
	console.log('proveedorByID-id',id);
	var pIndex = _.findIndex(exports.proveedores,'proveedorId',id);
	if(pIndex !== -1){
		return exports.proveedores[pIndex];
	} else {
		return false;
	}*/
	return exports.proveedores[id];
}
exports.getProveedorById = proveedorById;

exports.proveedorById = function(req,res,next,id){
	var proveedor = proveedorById(id);
	if(!proveedor){
		return res.status(404).send({
					message: 'Proveedor no encontrado'
				});		
	}	
	req.proveedor = proveedor;
	next();
}


function almacenById(id){
	if(_.isEmpty(exports.almacenes)){
		loadProveedores();
	}
	//console.log('exports.almacenes',exports.almacenes);
	//console.log('almacenByID-id',id);
	return exports.almacenes[id];
	/*var pIndex = _.findIndex(exports.almacenes,'almacenId',id);
	if(pIndex !== -1){
		return exports.almacenes[pIndex];
	} else {
		return false;
	}*/
	
}
exports.getAlmacenById = almacenById;

exports.almacenById = function(req,res,next,id){
	var almacen = almacenById(id);
	if(!almacen){
		return res.status(404).send({
					message: 'Almacen no encontrado'
				});		
	}	
	req.almacen = almacen;
	next();
}

/**
 * Show the current Proveedore
 */
exports.readProveedor = function(req, res) {
	res.jsonp(req.proveedor);
};

exports.readAlmacen = function(req, res) {
	res.jsonp(req.almacen);
};
/**
 * List of Proveedores
 */
exports.listProveedores = function(req, res) {
	if(_.isEmpty(exports.proveedores)){
		loadProveedores();
	}
	res.jsonp(exports.proveedores);
};

exports.listAlmacenes= function(req, res) {
	if(_.isEmpty(exports.almacenes)){
		loadProveedores();
	}
	res.jsonp(exports.almacenes);
};