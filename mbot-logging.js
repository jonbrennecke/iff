var clc = require('cli-color');


// xterm colors
var cmd = clc.xterm(47),
	arg = clc.xterm(197),
	url = clc.xterm(229),
	err = clc.xterm(196),
	warn = clc.xterm(166),
	log = clc.xterm(229),
	dull = clc.xterm(188);


// logging functions
var logs = function(){};

logs.prototype = {

	serverError : function ( msg ) {
		console.log( err( msg ) )
		return this;
	},

	mbotJsonExistsError : function ( dir ) { 
		console.log( err( "Package could not be created. There is already a file named \"mbot.json\" in " + ( dir ? "\"" + dir + "\"" : "the current directory" ) ) );
		return this;
	},

	mkdirError : function ( dir ) { 
		console.log( err( "The directory \"" + dir + "\" could not be created" ) );
		return this;
	},

	notModError : function ( dir ) {
		console.log( err( "The directory" + ( dir ? " \"" + dir + "\"" : "" ) + " is not an mbot module." ) );
		return this;
	},

	http : function ( uri, method ) {
		console.log( cmd( ">>> http ") + arg(method + " ") + url(uri) );
		return this;
	},

	msg : function ( msg ) {
		console.log( log( msg ) );
		return this;
	},

	git : function ( uri ) {
		console.log( cmd( ">>> git" ) + arg( " clone ") + url( uri ) );
		return this;
	},

	die : function () {
		process.exit();
	}

};

module.exports = new logs();