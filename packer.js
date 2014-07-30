#!/usr/bin/env node

/**
 *
 * ██╗███████╗███████╗
 * ██║██╔════╝██╔════╝
 * ██║█████╗  █████╗  
 * ██║██╔══╝  ██╔══╝  
 * ██║██║     ██║    
 * ╚═╝╚═╝     ╚═╝    
 *
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * DESCRIPTION
 * 
 * The "Packer" object handle's most basic package things like publishing, installing
 * and updating packages
 *
 */


var http = require('http'),
	fs = require('fs'),
	request = require('request'),
	spawn = require('child_process').spawn,
	Q = require("q"),
	log = require( __dirname + "/logging" );



function Packer () {

	// 'remote' is deffered until the JSON config file can be read.
	this.remote = Q.defer();

};

Packer.prototype = {


	/**
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 * register a module with the server
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 */
	publish : function ( dir ) {

		// defer until remote is resolved
		this.remote.promise.then( function ( remote ) {

			fs.readFile( ( dir || "." ) + "/iff.json", function ( err, data ) {
				
				// if the iff.json file doesn't exist, then we aren't in a valid module
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
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 * interactively init a package
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 * If a name is passed as an argument ('dir'), create a package in 
	 * the directory with that name (if it exists, or create it if it doesn't)
	 * otherwise, init the package within the current directory
	 * 
	 */
	init : function ( dir ) {
		require( __dirname + "/init" )( dir );
	},


	/**
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 * append a line adding <path> to the setup.m file
	 * (creates setup.m if it doesn't already exist)
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 */
	addToSetup : function ( path ) {
		fs.appendFile( 'setup.m', "\r\naddpath '" + path + "'", function ( err ) {
			if ( err )
				console.log( err )
		});
	},


	/**
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 * append a line adding <path> to the setup.m file
	 * (creates setup.m if it doesn't already exist)
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 */
	createRequireFunction : function ( path ) {
		fs.createReadStream( __dirname + '/require.m').pipe(fs.createWriteStream( 'require.m' ));
	},


	/**
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 * query if a package by a given name exists,
	 * if so fetch it and unpack it
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 */
	install : function ( name ) {

		// defer until remote is resolved
		this.remote.promise.then( function ( remote ) {

			var url = "http://" + remote + "/api/find";
			log.http( url, "GET" );

			// ask the server for the package matching 'name'
			request.get( url, { json : { name : name } }, function ( req, res ) {

				if ( res && res.body && res.body.status == 200 ) { // the package has been found

					var pkg = res.body.message.packages[0];

					if ( pkg.repository ) {
						log.git( pkg.repository );
						
						// install a git repository
						var git = spawn( "git", [ "clone", pkg.repository, "modules/" + name ] );

						git.stderr.on( 'data', function ( data ) {
							console.log( data.toString() )
						});

						git.stdout.on( 'data', function ( data ) {
							console.log( data.toString() )
						});

						this.createRequireFunction( name );
					}
					else { console.log("The package repository could not be located.") }
				}
				else if ( res && res.body && res.body.status == 404 )
					log.msg( res.body.message );
				else {
					log.serverError( res && res.body ? res.body.message : "Could not reach server! " +
						"Use 'iff config remote=<url>' to tell iff where to find the server." );
				}

			}.bind(this) );
		}.bind(this) );
			
	}

};

module.exports = new Packer();