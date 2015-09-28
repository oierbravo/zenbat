'use strict';

/**
 * Module dependencies.
 */
var zenbatConfig = require('../../zenbat.config.js');

var walk    = require('walk');
var fs      = require('fs');
var XLSX = require('xlsx');

var Componentes = require('./componentes.server.controller.js');

var mongoose = require('mongoose'),
    _ = require('lodash');

function getArmario(id){
  
  var workbook = XLSX.readFileSync('./data/armarios/' + id + '.xlsx');

  var componentesRaw = XLSX.utils.sheet_to_json(workbook.Sheets.componentes,{header:zenbatConfig.armarios.header,range:3});
  var componentes = componentesRaw.filter(function(element,index){
  	 return (element.Cantidad)?true: false;
  });
 
  return {
  	id: id,
  	
  	componentes:componentes
  };
}


/**
 * Show the current Armario
 */
exports.read = function(req, res) {

  req.armario = getArmario(req.armario.id);
  res.json(req.armario);
};




/**
 * List of Armarios
 */
exports.list = function(req, res) {
   	var result = [];
	var walker  = walk.walk(zenbatConfig.armarios.folder, { followLinks: false });
	//console.log('getArmarios');
	walker.on('file', function(root, fileStat, next){

		var filename = fileStat.name;
		if(filename.charAt(0) !== '~'){
			var armario = {
				id: fileStat.name.replace('.xlsx',''),
				filename: fileStat.name
			};
	   	   result.push(armario);
	   	}
   	next();
    });

    walker.on('end', function(){
		exports.armarios = result;
        res.jsonp(exports.armarios);
	});
		
	
};

exports.armarioByID = function(req, res, next, id) {
	req.armario = {
			id:id,
		
		};
		next();
};


function verificarStock(idArmario,qtyArmarios,marcarReserva,clearCache){
	var armario = getArmario(idArmario);
	
	//console.log(req);
	//console.log('qtyArmarios:',qtyArmarios);
	var result = [];
	var status = 'ok';
	armario.componentes.forEach(function(element,index){
		//console.log('armario.componentes.forEach',element);
		if(element.Codigo){
			var gotComponente = Componentes.verificarStock(element.Codigo,element.Cantidad * qtyArmarios);
			//console.log('gotComponente',gotComponente);
			if(gotComponente){
				if(gotComponente === true){
					//status = 'ok';
				} else {
					//status = false;
					status = 'missing componentes';
					
				}
			} else {
				status = 'missing ids';
			}
			if(gotComponente === true){
				//nothing
			} else {
				result.push({
						codigo:element.Codigo,
						stock: gotComponente
					});
			}
		}
	});
//console.log('armario.verif.result',result);
	return {
		status: status,
		componentes:result
	};

}
exports.verificarStock = verificarStock;
exports.verificar = function(req, res){
	//console.log('verif server');
	var clearCache = true;
	var output = verificarStock(req.armario.id,req.query.qty,true,clearCache);
	//console.log('armario.verificarStock',output);
	res.jsonp(output);

};

function entregar(idArmario,qtyArmarios){
	var armario = getArmario(idArmario);
	
	//console.log(req);
	//console.log('qtyArmarios:',qtyArmarios);
	var result = [];
	var status = 'ok';
	armario.componentes.forEach(function(element,index){
		//console.log('armario.componentes.forEach',element);
		if(element.Codigo){
			//var gotComponente = Componentes.verificarStock(element.Codigo,element.Cantidad * qtyArmarios);
			var takeComponente = Componentes.takeComponente(element.Codigo,element.Cantidad * qtyArmarios);
			console.log('takeComponente',takeComponente);
			
			if(takeComponente === true){
		
			} else {
				status = 'fail';
				/*result.push({
						codigo:element.Codigo,
						stock: gotComponente
					});*/
			}
		}
	});
	Componentes.guardarCambios();
	if(status === 'ok'){



		return 'OK';
	} else {
		return 'FAIL';
	}
//console.log('armario.verif.result',result);
	/*return {
		status: status,
		result:result
	};*/

}
exports.entregar = entregar;
/*
exports.entregar = function(req, res){
	//console.log('verif server');
	var output = entregar(req.armario.id,req.query.qty);
	//console.log('armario.verificarStock',output);
	res.jsonp(output);

};*/