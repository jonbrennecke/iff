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
 * Iff is a package manager for MATLAB and Octave (but this is just the Command Line Interpreter)
 *
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * USAGE:
 *
 * type "iff help" to display the help information
 *
 */

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// let's grab some modules
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var clc = require('cli-color'),
	fs = require('fs'),
	Q = require('q'),

	// local modules
	packer = require( __dirname + "/packer" ),
	log = require( __dirname + "/logging" );


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 'iff help' will display a message about the CLI syntax for iff
// this message is contained in the file 'help.txt', which we'll load into 'helpstring'
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var helpstring = Q.defer();

fs.readFile( __dirname + "/help.txt", "utf8", function ( err, data ) {
	if ( err )
		helpstring.reject( err );
	else
		helpstring.resolve( data );
});


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// if no arguments are provided, display the helpstring
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
if ( process.argv.length == 2 ) {
	
	console.log( clc.redBright("requires command line arguments\n") );

	helpstring.promise.then( function ( str ) {
		console.log( str ) 
	});
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// read the config.json file into 'config'
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var config = {};

fs.readFile( __dirname + "/config.json", "utf8", function ( err, data ) {

	// handle errors with JSON.parse
	try {
		config = JSON.parse( data );

		// if 'remote' is set in the config JSON file, use that
		packer.remote.resolve( config.remote || 'localhost:8080' )
	}
	catch ( e ) {

		// catch and consume Syntax Errors (which will be generated if the config file is empty)
		if ( !( e instanceof SyntaxError ) )
			throw e;
	}

});




// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// read the command line arguments
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
for ( var i = 0; i < process.argv.length; i++ ) {

	switch ( process.argv[i] ) {

		case "help" :
			helpstring.promise.then( function ( str ) {
				console.log( str ) 
			});
			break;

		case "install" :

			// if a package name is passed, then install that package
			// otherwise, check for a local 'iff.json' and install all the dependencies listed in it

			if ( !process.argv[i+1] ) {
				console.log( clc.redBright( "\"install\" requires a package name" ) );
				break;
			}

			packer.install( process.argv[i+1] );
			break;

		case "publish" :
			packer.publish( process.argv[i+1] || "" );
			break;

		case "init" :
			packer.init( process.argv[i+1] || "" );
			break;


		/**
		 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		 * configuration data is stored in a "config.json" file and is loaded each time iff is run.
		 *
		 * To alter the config data, pass arguments to "iff config" in key=value pairs like:
		 *
		 * $ iff config remote=http://github.com/user/repo
		 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		 */
		case "config" :

			// look through command line arguments for key=value pairs
			for ( var j = i + 1; j < process.argv.length; j++ ) {
				var match = process.argv[j].match( /(.+)=(.+)/ );

				if ( match ) config[ match[1] ] = match[2];
			}


			// combine 'config' with the config file data and reoutput the config file
			var str = JSON.stringify( config, null, 4);
			fs.writeFile( __dirname + "/config.json", str );

			log.msg( "Configuration saved." );

			break;

		/**
		 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		 * with the option 'build', iff will build C and/or C++ files for MEX 
		 *
		 * $ iff build 'target'
		 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		 */
		case "build" :

			var make = require( __dirname + '/make' );
			var manifest = require( process.env.PWD + '/iff.json' );

			if ( !manifest.hasOwnProperty('build') )
				clc.red("No field 'build' in the manifest file 'iff.json'");

			// build the file
			make( manifest.build );


			break;

		case "update" :
		case __filename :
		case process.execPath :
		default :
			break;
	}

}