var clc = require('cli-color');



function Packer () {

};

Packer.prototype = {

	install : function ( pkg ) {
		if ( !pkg ) {
			console.log( clc.redBright( "\"install\" requires a package name" ) );
			return;	
		}

		
		
	}

};

module.exports = new Packer();