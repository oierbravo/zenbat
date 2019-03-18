'use strict';

module.exports = {
	app: {
		title: 'Zenbat',
		description: 'Zenbat, inventory and manufacturing.',
		keywords: 'mrp,inventory,manufacturing'
	},
	port: process.env.PORT || 80,
	templateEngine: 'swig',
	sessionSecret: 'MEAN',
	sessionCollection: 'sessions',
	assets: {
		lib: {
			css: [
				'public/lib/bootstrap/dist/css/bootstrap.css',
				'public/lib/bootstrap/dist/css/bootstrap-theme.css',
				'public/lib/fontawesome/css/font-awesome.css',
				'public/lib/ngprogress/ngProgress.css',
				'public/lib/angular-tags/dist/angular-tags-0.2.10.css'
			
			],
			js: [
				'public/lib/ng-file-upload/FileAPI.min.js', 
	            'public/lib/ng-file-upload/ng-file-upload-shim.min.js',
				'public/lib/angular/angular.js',
				'public/lib/angular-resource/angular-resource.js', 
				'public/lib/angular-cookies/angular-cookies.js', 
				'public/lib/angular-animate/angular-animate.js', 
				'public/lib/angular-touch/angular-touch.js', 
				'public/lib/angular-sanitize/angular-sanitize.js', 
				'public/lib/angular-ui-router/release/angular-ui-router.js',
				'public/lib/angular-ui-utils/ui-utils.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
				'public/lib/lodash/lodash.js',
				'public/lib/ng-file-upload/ng-file-upload.min.js',
				'public/lib/file-saver/FileSaver.min.js',
				'public/lib/js-xlsd/dist/xlsx.full.min.js',
				'public/lib/spin.js/spin.min.js',
				'public/lib/angular-spinner/angular-spinner.js',
				'public/lib/ngprogress/build/ngprogress.js',
				'public/lib/marked/lib/marked.js',
				'public/lib/angular-marked/dist/angular-marked.min.js',
				'public/lib/angular-tags/dist/angular-tags-0.2.10-tpls.min.js',
				'public/lib/angular-tags/dist/angular-tags-0.2.10.min.js'

			]
		},
		
		css: [
			'public/modules/**/css/*.css'
		],
		js: [
			'public/config.js',
			'public/application.js',
			'public/modules/**/*.js'
		]
	}
};