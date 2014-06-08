/**
 * 
 * The "Packer" object's job is to handle basic package things, like publishing, creating and updating packages
 *
 */


var http = require('http'),
	fs = require('fs'),
	request = require('request'),
	spawn = require('child_process').spawn,
	Q = require("q"),
	log = require( __dirname + "/mbot-logging" );



function Packer () {

	// 'remote' is deffered until the JSON config file can be read.
	this.remote = Q.defer();

};

Packer.prototype = {


	/**
	 * 
	 * register a module with the server
	 *
	 */
	publish : function ( dir ) {

		// defer until remote is resolved
		this.remote.promise.then( function ( remote ) {

			fs.readFile( ( dir || "." ) + "/mbot.json", function ( err, data ) {
				
				// if the mbot.json file doesn't exist, then we aren't in a valid module
				if ( err && err.code == "ENOENT" )
					log.notModError( dir ).die();

				var url = "http://" + remote + "/api/publish",
					pkg = JSON.parse( data );

				log.http( url, "POST" );

				// POST the json data to the server
				request.post( url, { json : { pkg : pkg.name, data : pkg } }, function ( err, res ) {
					
					if ( err && err.code == "ECONNREFUSED" )
						log.serverError( "Couldn't reach the server!" ).die();
					else if ( err )
						throw( err )
					if ( res.body && res.body.status == 201 )
						log.msg( "The package has been added to the database." );
					else if ( res.body && res.body.status == 200 )
						log.msg( "The package has been updated on the database." );
					else {
						log.serverError( res.body.message ).die();
					}

				});

			});

		});

	},



	/**
	 *
	 * interactively init a package
	 *
	 * If a name is passed as an argument ('dir'), create a package in 
	 * the directory with that name (if it exists, or create it if it doesn't)
	 * otherwise, init the package within the current directory
	 * 
	 */
	init : function ( dir ) {
		require( __dirname + "/mbot-init" )( dir );
	},


	/**
	 *
	 * append a line adding <path> to the setup.m file
	 * (creates setup.m if it doesn't already exist)
	 *
	 */
	addToSetup : function ( path ) {
		fs.appendFile( 'setup.m', "\r\naddpath '" + path + "'", function ( err ) {
			if ( err )
				console.log( err )
		});
	},


	/**
	 *
	 * query if a package by a given name exists,
	 * if so fetch it and unpack it
	 *
	 */
	install : function ( pkg ) {

		// defer until remote is resolved
		this.remote.promise.then( function ( remote ) {

			var url = "http://" + remote + "/api/install?pkg=" + pkg;
			log.http( url, "GET" );


			// ask the server for a url to download the package
			request.get( url, { json : { pkg : pkg } }, function ( req, res ) {

				if ( res && res.body && res.body.status == 200 ) { // the package has been found

					log.git( res.body.message );

					// install a git repository
					var git = spawn( "git", [ "clone", res.body.message, "mbot-modules/" + pkg ] );

					this.addToSetup( pkg );

				}
				else if ( res && res.body && res.body.status == 404 )
					log.msg( res.body.message );
				else {
					log.serverError( res && res.body ? res.body.message : "Could not reach server! " +
						"Use 'mbot config remote=<url>' to tell mbot where to find the server." );
				}

			}.bind(this) );

		}.bind(this) );
			
	}

};

module.exports = new Packer();