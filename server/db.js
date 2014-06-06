var mongoose = require('mongoose'),
	mongoUrl = "ds043057.mongolab.com:43057/mbot";
	

// mongodb error handler
mongoose.connection.on("error", function ( err ) {
	
	if ( err.code == 18 ) { // authentication fail
		console.error( "ERROR >>> MongoDB authentication failed" );
		process.exit();
	}

	// otherwise demote the error to a warning
	else console.warn( err );
});


// once a connection is opened
mongoose.connection.on( "open", function () {
	console.log( ">>> opened mongodb connection at " + mongoUrl );
});

// try authenticating with the username and password given as arguments
mongoose.connect("mongodb://testuser:pass@" + mongoUrl );

module.exports = mongoose.connection;