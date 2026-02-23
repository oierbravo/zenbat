/**
 * Module dependencies.
 */
var fs = require('fs'),
	path = require('path'),
	express = require('express'),
	morgan = require('morgan'),
	bodyParser = require('body-parser'),
	compress = require('compression'),
	methodOverride = require('method-override'),
	cookieParser = require('cookie-parser'),
	helmet = require('helmet'),
	cors = require('cors'),
	flash = require('connect-flash'),
	config = require( './config'),
	consolidate = require('consolidate'),
	json2xls = require('json2xls');

	

 var database = require('../app/controllers/database.server.controller.js');



 module.exports = function() {
	// module.exports = function(db) {
	// Initialize express app
	var app = express();

	// Setting application local variables
	app.locals.title = config.app.title;
	app.locals.description = config.app.description;
	app.locals.keywords = config.app.keywords;
	app.locals.jsFiles = config.getJavaScriptAssets();
	app.locals.cssFiles = config.getCSSAssets();
	
	app.locals.database = database;

	// Passing the request url to environment locals
	app.use(function(req, res, next) {
		res.locals.url = req.protocol + '://' + req.headers.host + req.url;
		next();
	});

	// Should be placed before express.static
	app.use(compress({
		filter: function(req, res) {
			return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
		},
		level: 9
	}));

	// Showing stack errors
	app.set('showStackError', true);

	// Set swig as the template engine
	app.engine('server.view.html', consolidate[config.templateEngine]);

	// Set views path and view engine
	app.set('view engine', 'server.view.html');
	app.set('views', path.join(__dirname, '../app/views'));

	// Environment dependent middleware
	if (process.env.NODE_ENV === 'development') {
		// Enable logger (morgan)
		app.use(morgan('dev'));

		// Disable views cache
		app.set('view cache', false);
	} else if (process.env.NODE_ENV === 'production') {
		app.locals.cache = 'memory';
	}

	// Request body parsing middleware should be above methodOverride
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json());
	app.use(methodOverride());

	// CookieParser should be above session
	app.use(cookieParser());

	// connect flash for flash messages
	app.use(flash());

	// Use helmet to secure Express headers
	app.use(helmet.xframe());
	app.use(helmet.xssFilter());
	app.use(helmet.nosniff());
	app.use(helmet.ienoopen());
	app.disable('x-powered-by');

	// CORS: allow frontend (separate origin) to call the API
	app.use(cors({ origin: true, credentials: true }));

	// API routes
	const armarioGeneratorServer = require('../app/routes/armario-generator.server.routes')(app);
	const armariosServer = require('../app/routes/armarios.server.routes')(app);
	const componentesServer = require('../app/routes/componentes.server.routes')(app);
	const coreServer = require('../app/routes/core.server.routes')(app);
	const fileUploadImporterServer = require('../app/routes/file-upload-importer.server.routes')(app);
	const historialServer = require('../app/routes/historial.server.routes')(app);
	const pedidosProveedoresServer = require('../app/routes/pedidos-proveedores.server.routes')(app);
	const pedidosServer = require('../app/routes/pedidos.server.routes')(app);
	const proveedoresServer = require('../app/routes/proveedores.server.routes')(app);

	// Standalone mode: respond at / so it's clear the API is running
	if (config.frontendMode === 'standalone') {
		app.get('/', function(req, res) {
			res.json({
				zenbat: 'API',
				message: 'Frontend not served. Set ZENBAT_FRONTEND=angular or ZENBAT_FRONTEND=react to serve a frontend.'
			});
		});
	}

	// Serve frontend static files by mode
	if (config.frontendMode === 'angular') {
		app.use(express.static(path.join(__dirname, '../../public')));
		var core = require('../app/controllers/core.server.controller');
		app.get('*', function(req, res, next) {
			if (req.method !== 'GET' || !req.accepts('html')) return next();
			core.index(req, res);
		});
	} else if (config.frontendMode === 'react') {
		var reactDist = path.join(__dirname, '../../client/dist');
		app.use(express.static(reactDist));
		// SPA fallback: non-API GET requests without a file serve index.html
		app.get('*', function(req, res, next) {
			if (req.method !== 'GET') return next();
			if (req.accepts('html')) {
				res.sendFile(path.join(reactDist, 'index.html'));
			} else {
				next();
			}
		});
	}

	// Assume 'not found' in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
	app.use(function(err, req, res, next) {
		// If the error object doesn't exists
		if (!err) return next();

		// Log it
		console.error(err.stack);

		// Error page
		res.status(500).render('500', {
			error: err.stack
		});
	});

	// 404 for unknown API routes
	app.use(function(req, res) {
		res.status(404).json({ error: 'Not Found', url: req.originalUrl });
	});

	app.use(json2xls.middleware);

	// Return Express server instance
	return app;
};