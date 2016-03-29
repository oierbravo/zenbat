#TODO FIXES
- leyenda
* excel cosas pendientes a pedir.  PROVEEDOR - PRODUCTO - CANTIDAD - NOTAS
- verificar entragas parciales (p.prov);
- revisar residuos en ped. proveedores.

[done]#AÑADIR COMPONENTES AL ANGULAR del armario
		#YA SE PUEDEN FILTRAR LOS COMPONENTES EN LOS ARMARIOS

[done]#Cuando existan el numero de pedido  prov. confirmar sobreescribir.
[done]#informar del ultimo numero.

#TODO NU
- new pedido status: "Componentes en camino"
	- stock por llegar e ir descontando.
- Logger:
	- Para cambiar el historial borrar y darle a recargar.
	- Marcar entrada y salida en logs largos
	* Componentes: modif stock,
	- Pedidos: entregado
	- P.Prov: add,update,delete,recibido,
	- Loggear todas las acciones, automaticas tambien. Ej: al entregar un pedido figurara la entrega y todos los componentes descontados. 

	-Pantalla "Historial"
		- Buscador
		- FECHA - CODIGO - CATEGORIA - DESCRIPCION
		- categoria: manual, proveedores, clientes
		- categorias logs largos, completando/listo
#ID
- Link pedidos y p.prov para status?
* Log to file with Wiston or bunyan.



# TO PRODUCTION
x bck files,dbs,xls
x git fetch
x Startup script.
	-on pc boot
	-workaround for data recover.

##SERVICE
- BAT2EXE 
- NSSM to create service


##TODO PRODUCTION
- gruntfile: comment "jshint" task

## Desplegable usuarios.