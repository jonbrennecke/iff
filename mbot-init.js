/**
 *
 * interactively init a package in 'dir'
 *
 * this method is strictly additive; it will not override any preexisting files.
 * 
 */


var fs = require('fs'),
	mkdirp = require('mkdirp'),
			rl = require('readline').createInterface({
			input: process.stdin,
			output: process.stdout
		}),
	log = require( __dirname + "/mbot-logging" );


// basic module default prompts
var defaults = {
	name : { value : String },
	author : { value : String },
	description : { value : String },
	version : { def : "0.0.0", value : String },
	repository : { text : "git repository", value : String },
	main : { text : "entry point", def : "main.m", value : String },
	dependencies : { value : Array },
	keywords : { value : Array }
};


module.exports = function ( dir ) {

	// creates a mbot.json and mbot-modules folder within 'subdir'
	// if 'subdir' is undefined, they are created within the current directory
	function __init ( subdir ) {

		// 'wx' means opening will fail if there is already a file at the given path
		fs.open( ( subdir || ".") + "/mbot.json", "wx", function ( err, fd ) {

			// if mbot.json already exists, throw an error
			if ( err && err.code == "EEXIST" )
				log.mbotJsonExistsError( subdir ).die();


			// interactively build the mbot.json file
			console.log( "This utility will walk you through creating an \"mbot.json\" file.\n" );

			rl.question( "Press ENTER to continue (exit at any time by hitting Control^C)\n", function () {				

				var keys = Object.keys( defaults ), prompt, answers = {};

				// iterate through the prompts
				( function prompt ( i ) {

					rl.question( "[?] " + ( defaults[ keys[i] ].text || keys[i] ) + 
							( defaults[ keys[i] ].def ? " (" + defaults[ keys[i] ].def + ")" : "" ) + ": ", function ( res ) {
						
							// split arrays at commas and/or semi-colons
							// and use defaults if the user's response is empty
							answers[ keys[i] ] = ( Array === defaults[ keys[i] ].value ) ? res.split(/\s*[,;]\s*/) : ( res || ( defaults[ keys[i] ].def || "" ) );
							
							rl.pause();

							if ( i == keys.length - 1 ) {

								rl.close();
								console.log( "\nOk, You entered:\n " );
								console.log( JSON.stringify( answers, null, 4 ) + "\n" );
								fs.write( fd, JSON.stringify( answers, null, 4 ) );

								// TODO probably handle an error if the module can't be created
								mkdirp( ( subdir || "." ) + "/mbot-modules" );

								log.msg( "Success! New module created " + ( subdir ? ( "in \"" + subdir + "\""  ) : "in the current folder" ));
							}

							// recursively call prompt
							else prompt( i+1 );

						});
				})( 0 ); 
				
			});

		})

	} // end of __subinit


	// call __init within a folder
	fs.stat( dir || ".", function ( err, stats ) {
		
		// if the directory doesn't exist, create it (recursively, using "mkdir -p")
		if ( err && err.code == "ENOENT" ) {
			mkdirp( dir, function ( err ) {
				if ( err )
					log.mkdirError( dir ).die();
				
				// within the subdirectory create the mbot.json and mbot-modules folder
				__init( dir );

			});
		}

		// if the directory already exists, determine if it's already a module
		else {

			// stat "mbot.json" to determine whether "dir" is a valid module
			// (defaults to the current directory if "dir" is undefined)
			fs.stat( ( dir || "." ) + "/mbot.json", function ( err, stats ) {
				if ( !err )
					log.mbotJsonExistsError( dir ).die();

				// if it's not a module, create one within the folder
				__init( dir );
			});
		}
	}); 

};