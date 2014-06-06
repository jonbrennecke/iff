/**
 *
 * matbot
 *
 *
 * RESTful API
 *
 * endpoints:
 *
 *
 */
  


var express = require('express'),
	app = express(),
	router = express.Router(),
	bodyParser = require('body-parser'),
	db = require( __dirname + '/db.js' ),
	Package = require( __dirname + "/api/models/package" ),
	log = require( __dirname + "/api/logging" );



// express config
app.use( bodyParser() );
app.use( '/api', router );


//
router.route( '/install' )
	.get( function ( req, res ) {
		
		Package.findOne({ name : req.body.pkg }, function ( err, pkg ) {

			if ( pkg ) {

				// if a package is found, return it's repository info
				res.send( log.get( "ok", pkg.repository ) );

			}
			else {
				res.send( log.get( "notFound", "The server couldn't find a package matching \"" + req.body.pkg + "\" in the database." ) );
			}

		});


	})

router.route( '/publish' )

	/**
	 *
	 * POST to /publish registers a package in the DB
	 *
	 */
	.post( function ( req, res ) {

		// check if the POSTed data looks like a valid mbot.json
		if ( req.body.data && req.body.data instanceof Object ) {

			Package.findOne({ name : req.body.pkg }, function ( err, pkg ) {

				// if a package by this name already exists, we need to compare
				// versions to see if we should update the package
				if ( pkg ) {
					
					if ( Number( req.body.data.version ) > pkg.version ) {

						// publish a newer version, so update the package
						pkg.update( req.body.data, function ( err ) {
							
							if ( err )
								res.send( log.get( "serverError", "Database error encountered while saving the file." ) );
							else
								res.send( log.get( "ok", "The package has been updated on the server." ) );
						});

					}
					else if ( Number( req.body.data.version ) == pkg.version ) {
						res.send( log.get( "notModified", "A package by the same name and version " + 
							"already exists.\nIf you are the creator of the \"" + req.body.pkg +
							"\" package and are trying to update it, please increment the version number first."  ) );
					}
					else {
						res.send( log.get( "notModified", "a package by the same name already exists" ) );
					}

				}

				// couldn't find a package (matching the name), so create a new one
				else {
					
					var pkg = new Package( req.body.data );

					pkg.save( function ( err ) {

						if( err )
							res.send( log.get( "serverError", err ) );

						else
							res.send( log.get( "created", "created package" ) );

					});
				}

			});

		}

		// no (or bad) 'data' field associated with the package
		else
			res.send( log.get( "badRequest", "invalid \"package.json\"" ) );

	});


app.listen(2999);


