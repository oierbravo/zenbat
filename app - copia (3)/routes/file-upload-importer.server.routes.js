'use strict';
var uuid = require('uuid'); // https://github.com/defunctzombie/node-uuid
var multiparty = require('multiparty'); // https://github.com/andrewrk/node-multiparty

var componentes = require('../../app/controllers/componentes.server.controller');
var XLSX = require('xlsx');
var _ = require('lodash');

module.exports = function(app) {
	app.post('/import/archivo', function(req, res) {
    var form = new multiparty.Form();
    console.log('IMPORTANDO');
    form.parse(req, function(err, fields, files) {
      if(typeof files !== 'undefined'){
        var file = files.file[0];

        var contentType = file.headers['content-type'];
        var extension = file.path.substring(file.path.lastIndexOf('.'));
        var destPath = '/tmp/' + uuid.v4() + extension;
        var workbook = XLSX.readFileSync(file.path);
        console.log(workbook.SheetNames);
        var sheetName = workbook.SheetNames[0];
        var componentesImportRaw = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);


  	    componentesImportRaw.forEach(function(element,index){
          var failed = [];
         
          if(!_.isEmpty(element.cantidadReal)){
              var cantidad = parseFloat(element.cantidadReal);
            var result = componentes.updateComponenteCantidad(element.codigo,cantidad);
            if(!result){
              failed.push(element);
            }
          }

    	  	
     	  });
        res.send(200);
      }
    });
  });
};