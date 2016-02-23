#TODO FIXES
* Fecha de entrega
* pedido clientes - pedido proveedores.
* info recarga solo pedidos pendientes.
- leyenda
* excel cosas pendientes a pedir.  PROVEEDOR - PRODUCTO - CANTIDAD - NOTAS
- verificar entragas parciales (p.prov);

#AÑADIR COMPONENTES AL ANGULAR del armario

#TODO NU
- new pedido status: "Componentes en camino"
	- stock por llegar e ir descontando.
- Logger:
	- Marcar entrada y salida en logs largos
	- Componentes: modif stock,
	- Pedidos: entregado
	- P.Prov: add,update,delete,recibido,
	- Separar por año y mes.
	- Loggear todas las acciones, automaticas tambien. Ej: al entregar un pedido figurara la entrega y todos los componentes descontados. 

	-Pantalla "Historial"
		- Buscador
		- FECHA - CODIGO - CATEGORIA - DESCRIPCION
		- categoria: manual, proveedores, clientes
		- categorias logs largos, completando/listo
#ID
- Link pedidos y p.prov para status?
- Log to file with Wiston or bunyan.



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