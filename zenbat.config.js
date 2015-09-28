'use strict';


module.exports = {
	basePath: 'C:\\Ezarri\\Zenbat\\',
	componentes: {
		file: 'productos.xlsx'
		,header: ['codigo','denominacion','stockSeguridad','proveedor','codProveedor','pedidoMinimo','yearPrecio','precioUnit','notas','proveedor2','codProveedor2','pedidoMinimo2','yearPrecio2','precioUnit2','notas2','proveedor3','codProveedor3','pedidoMinimo3','yearPrecio3','precioUnit3','notas3']

	}
	,stock: {
		header: ['codigo','denominacion','cantidad','cantidadReservada']
	}
	,armarios: {
		folder: 'armarios'
		,header: ['Codigo','Denominacion','PrecioUnitario','Cantidad','PrecioTotal']
	}
	,pedidos: {
		file:'pedidos.xlsx'
		,header:['fecha','codigo','rev','cantidad','PC','PT','Grua','Notas','vacio','cables','perfiles','canaleta','material','cableados','entregados']
	},
	proveedores: {
		file: 'proveedores.xlsx',
		header:['Nombre','Direccion','CP','Poblacion','Tlf','Fax','Email','Notas']
	},
	pedidosProveedores: {
		dbFile: 'db\\pedidosProveedores.db',
		dbFileComponetes: 'db\\pedidosProveedoresComponentes.db'
	},
	config: {
		dbFile: 'db\\config.db'
	}
	
}; 
//folder: 'C:\\Ezarri\\Zenbat\\armarios'