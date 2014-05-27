#!/usr/bin/env node


// terminal colors
var magenta = "\x1B[35m",
	yellow = "\x1B[33m",
	green = "\x1B[32m",
	red = "\x1B[31;1m",
	reset = "\x1B[0m";


// read command line args
for ( var i = 0; i < process.argv.length; i++ ) {

	// --update / -u
	if ( process.argv[i] == "--update" )
		var path = process.argv[i+1];

}