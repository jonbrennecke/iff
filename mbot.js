#!/usr/bin/env node

/**
 *
 * MBOT is a package manager for MATLAB (but this is just the Command Line Interpreter)
 *
 *
 * USAGE:
 *		type "mbot help" to display the help information
 *
 * TODO:
 *		'mbot start'
 *		startup.m
 *		use symbolic links for globally installed files
 *
 */


// string to be displayed by "mbot help"
var helpstring = 
	"Usage: mbot [options]\n\n" +

	"Options: \n" + 
		"\tinstall <package>\tQuery the API for a given package; and if it's found, \n" +
		"\t\t\t\tdownload it, unpack it and add it to the matlab path.\n\n" +

		"\tinit [folder]\t\tInteractively create a package structure in a folder (or \n" +
		"\t\t\t\tthe current directory, if no folder is provided).\n\n" +

		"\tpublish [folder]\tIf 'folder' is a module, publish the module by \n" +
		"\t\t\t\tregistering it with the API.\n\n" +

		"\tconfig <key=value>\tSet a key value pair in the config file.\n\n" +

		"\thelp\t\t\tDisplay this prompt.\n"

	


var clc = require('cli-color'),
	_ = require("underscore"),
	fs = require('fs'),

	// local
	Packer = require( __dirname + "/mbot-packer" ),
	log = require( __dirname + "/mbot-logging" );





// if no arguments are provided, display the helpstring
if ( process.argv.length == 2 ) {
	console.log( clc.redBright("requires command line arguments\n\n") );
	console.log( helpstring );
}


/**
 *
 * read the mbot-config.json file
 *
 */

var config = {};

fs.readFile( __dirname + "/mbot-config.json", function ( err, data ) {

	// handle errors with JSON.parse
	try {
		config = JSON.parse( data.toString() );
	}
	catch ( e ) {
		if ( e instanceof SyntaxError ) {
			// catch the error and do nothing with it
		}
		else throw e;
	}

});


// if 'remote' is set in the config JSON file, use that; otherwise default to localhost
var packer = new Packer( config.remote || "localhost:80" );



/**
 *
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ read command line args ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
 * 
 */

for ( var i = 0; i < process.argv.length; i++ ) {

	switch ( process.argv[i] ) {

		case "help" :
			console.log( helpstring );
			break;

		case "install" :

			// ensure a package name is passed
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
		 *
		 * configuration data is stored in a "mbot-config.json" file and is loaded each time mbot is run.
		 *
		 * To alter the config data, pass arguments to "mbot config" in key=value pairs like:
		 *
		 * $ mbot config remote=http://github.com/user/repo
		 *
		 */
		case "config" :

			var params = {};

			// look through command line arguments for key=value pairs
			for ( var j = i + 1; j < process.argv.length; j++ ) {
				var match = process.argv[j].match( /(.+)=(.+)/ );

				if ( match ) params[ match[1] ] = match[2];
			}


			// combine 'config' with the config file data and reoutput the config file
			var str = JSON.stringify(_.extend( config, params ), null, 4);
			fs.writeFile( __dirname + "/mbot-config.json", str );

			log.msg( "Configuration saved." );

			break;


		case "update" :
		case __filename :
		case process.execPath :
		default :
			break;
	}

}