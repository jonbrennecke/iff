#!/usr/bin/env node


/**
 *
 * USAGE:
 *
 * install <package> - query the api for a given package and if it's found, download it, unpack it and add it to the matlab path
 * fetch <package> - query the api for a given package and if it's found, download it; but don't unpack it or add it to the matlab path
 * update <package> - query the api for any changes to the package
 * init <new package name> - init the default package structure in the current folder
 * add-to-path <package> - add a package to the matlab path
 *
 *
 */

var packer = require( __dirname + "/packer" ),
	clc = require('cli-color');


if ( process.argv.length == 2 )
	console.log( clc.redBright("requires command line arguments") )

// read command line args
for ( var i = 0; i < process.argv.length; i++ ) {

	switch ( process.argv[i] ) {
		case "install" :
			packer.install( process.argv[i+1] );
			break;
		case "update" :
		case "init" :
		case "add-to-path" :
		case __filename :
		case process.execPath :
		default :
			break;
	}

}