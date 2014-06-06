
/*
 *
 * server response JSON for RESTful API stuffs
 *
 */

var _ = require('underscore');

function Logger () {

};

Logger.prototype = {

	get : function ( name, msg ) {
		return _.extend( this[ "__" + name ], { message : msg });
	},

	// 200 - OK
	__ok : {
		status : 200,
		type : "OK"
	},

	// 201 - Created
	__created : {
		status : 201,
		type : "Created"
	},

	// 304 - Not Modified
	__notModified : {
		status : 304,
		type : "Not Modified"
	},
	
	// 400 - Bad Request
	__badRequest : { 
		status : 400, 
		type : "Bad Request"
	},

	// 401 - Unauthorized
	__unauthorized : {
		status : 401, 
		type : "Unauthorized"
	},

	// 403 - Forbidden
	__forbidden : {
		status : 403, 
		type : "Forbidden"
	},

	// 404 - Not Found
	__notFound : {
		status : 404, 
		type : "Not Found"
	},  

	// 500 - Internal Server Error
	__serverError : {
		status : 500,
		type : "Internal Server Error"
	}

};

module.exports = new Logger();