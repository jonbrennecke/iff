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
 * A build generator for Matlab MEX files that automatically links against the Matlab libraries
 *
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * USAGE:
 *
 * type "iff help" to display the help information
 *
 */

// define constants
var fs = require('fs'),
	spawn = require('child_process').spawn,
	_ = require('underscore'),
	clc = require('cli-color'), 
	Q = require('q'),

	// default compiler settings
	// TODO: check OS settings and check if compilers exist here
	compiler_defaults = {
		"cc" : "gcc",
		"cflags" : "-Wall",
		"cxx" : "g++",
		"cxxflags" : "-Wall"
	};


	/**
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 * Determine the Matlab root directory by stating
	 * several posible Matlab paths until a match is found
	 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	 */

	var isWin = ( /^win/.test(process.platform) ),
		foundMatlab = Q.defer();
		READY = Q.defer();

	if (isWin) {

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Windows!
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

		// possible Windows paths where Matlab might be located
		var matlab_paths = [ 
			process.env.ProgramFiles + '/MATLAB',
			process.env["ProgramFiles(x86)"] + '/MATLAB' ];

		// test each path until Matlab is found
		matlab_paths.some(function ( path ) {
			fs.stat( path, function ( err, stats ) {
				var this_path = path;
				if ( err ) {
					// no matlab here!
					return false;
				}
				else {
					foundMatlab.resolve({ path : this_path, arch : (/x86/.test(this_path) ? '32' : '64') });
					return true;
				}
			});			
		});

	}
	else {

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// It's a Unix system! 
		// TODO Linux
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

		foundMatlab.resolve({ path : '/Applications/MATLAB_R2013a.app/', arch : '64'});
	
	}

	// TODO - do something if this never resolves
	foundMatlab.promise.then(function ( info ) {

		var versions = fs.readdirSync(info.path),
			ext = (isWin?'win':'maci') + info.arch;

		// throw an error
		if ( !versions.length )
			throw("Could not find Matlab!");

		// append the matlab version to the path
		info.path += ( '/' + versions[0] + '/' );

		// define some matlab constants
		matlab_defaults = {
			flags : [ '-shared','-DMATLAB_MEX_FILE' ],
			dir : '"' + info.path,
			libs : ['mex','mx','mwlapack','mwblas','eng'],
			lib_paths : [ 'extern/lib/' + ext + (isWin?'/microsoft/"':'/"'), 'bin/' + ext + '/"' ],
			include_paths : [ 'extern/include/"' ], 
		};

		// windows spits out a bunch of warnings with -fPIC
		if ( !isWin ) matlab_defaults.flags.push('-fPIC');

		// let's go!
		READY.resolve( matlab_defaults );
	})


/**
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * export a function that takes the build description (as a JSON object) 
 * as the only parameter
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
module.exports = function ( makefile ) {

	// we have to wait til we know where Matlab is.... shouldn't be long
	READY.promise.then(function ( matlab_defaults ) {

		// merge the matlab definitions with the defaults
		var matlab = _.defaults( (makefile.matlab||{}), matlab_defaults );

			// merge the makefile compiler definition with the defaults
			compiler = _.defaults( (makefile.compiler||{}), compiler_defaults );

		// prefix the matlab paths with the the root matlab folder
		matlab.lib_paths = matlab.lib_paths.map(function (lib) { return '-L' + matlab.dir + lib; });
		matlab.include_paths = matlab.include_paths.map(function (inc) { return '-I' + matlab.dir + inc; });

		// generate rules
		var rules = makefile.rules || { "default" : makefile },
			keys = Object.keys( rules );

		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// build a rule
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		function build ( rule ) {

			if ( !rule.source )
				throw("No source files given!");

			if ( rule.compiler === 'cc' ) {
				
				var args = compiler.cflags.concat( rule.mex ? (rule.flags||[]).concat(matlab.flags) : rule.flags )

				if ( _.isObject(rule.target) ) {

					// .o or .obj files
					if ( rule.target.type === "object" ) {
						args = args
						.concat(['-c', rule.source.join(' ') ])
						.concat(['-o', rule.target.file ])
					}

					// static or dynamic libraries
					else if ( rule.target.type === "lib" ) {
						args = args
						.concat([ rule.source.join(" ") ]) // no -c flag
						.concat(['-o', rule.target.file ])
					}

					// TODO
					else {
						args = args.concat(['-c', rule.source.join(" ") ]);
					}
				}
				else {
					args = args.concat(rule.source).concat(['-o', rule.target]);
				}


				if ( rule.mex ) {
					args = args.concat(matlab.lib_paths)
						.concat(matlab.include_paths)
						.concat(matlab.libs.map(function (lib) { return '-l' + lib; }));
				}		

				// add libs and include paths
				args = args
					.concat(rule.include?rule.include.map(function (inc) { return '-I' + inc; }):[])
					.concat(rule.libs?rule.libs.map(function (lib) { return '-l' + lib; }):[]);

				console.log(args)

				// console message
				console.log( clc.redBright( '>>> ' + compiler.cc + ' ' + args.join(' ') ));

				// spawn the compiler
				var cc = spawn( compiler.cc, args );
				cc.stderr.pipe(process.stderr);
				cc.stdout.pipe(process.stdout);

				return cc
			}
		}


		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// construct a list of dependencies for each rule
		// to ensure that they're constructed in the correct order
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


		// construct an array of promises for each rule
		var promises = {};

		keys.forEach( function ( key ) {
			promises[key] = Q.defer();
		});

		// loop through the rules again
		keys.forEach( function ( key ) {

			var depends = [];

			if (rules[key].requires) {
				rules[key].requires.forEach(function ( rule ) {
					if ( promises[rule] )
						depends.push(promises[rule].promise)
				});
			}

			// wait to run the current rule until all its dependencies have been run
			Q.when( Q.all(depends), function () {
				
				// console message
				console.log( clc.cyanBright( '[ building ' + key + ' ]' ));

				build(rules[key]).on('close', function () {
					promises[key].resolve();
				});

			});

		});
	});

}