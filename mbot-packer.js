/**
 * 
 * The "Packer" object's job is to handle basic package things, like publishing, creating and updating packages
 *
 */


var http = require('http'),
	fs = require('fs'),
	request = require('request'),
	spawn = require('child_process').spawn,
	log = require( __dirname + "/mbot-logging" );



function Packer ( remote ) {
	this.remote = remote;
};

Packer.prototype = {


	/**
	 * 
	 * register a module with the server
	 *
	 */
	publish : function ( dir ) {

		fs.readFile( ( dir || "." ) + "/mbot.json", function ( err, data ) {
			
			// if the mbot.json file doesn't exist, then we aren't in a valid module
			if ( err && err.code == "ENOENT" )
				log.notModError( dir ).die();

			var url = "http://" + this.remote + "/api/publish",
				pkg = JSON.parse( data );

			log.http( url, "POST" );

			// POST the json data to the server
			request.post( url, { json : { pkg : pkg.name, data : pkg } }, function ( err, res ) {
				
				if ( res.body.status == 201 )
					log.msg( "The package has been added to the database." );
				else if ( res.body.status == 200 )
					log.msg( "The package has been updated on the database." );
				else {
					log.serverError( res.body.message )
				}

			});

		}.bind(this));

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



	// query if a package by a given name exists,
	// if so fetch it and unpack it
	install : function ( pkg ) {

		var url = "http://" + this.remote + "/api/install?pkg=" + pkg;
		log.http( url, "GET" );


		// ask the server for a url to download the package
		request.get( url, { json : { pkg : pkg } }, function ( req, res ) {

			if ( res.body.status == 200 ) { // the package has been found

				// TODO add support for other sorts of repositories
				switch ( res.body.message.type ) {
					
					case "git" : 

						log.git( res.body.message.url );

						// install a git repository
						var git = spawn( "git", [ "clone", res.body.message.url, "mbot-modules/" + pkg ] );

						break;

					default :
						break;
				}

			}
			else if ( res.body.status == 404 )
				log.msg( res.body.message );
			else {
				log.serverError( res.body.message )
			}
		});
		
	}

};

module.exports = Packer;