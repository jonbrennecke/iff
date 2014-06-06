var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var PackageSchema = new Schema({
	name : String,
	author : String,
	contributors : String,
	main : String,
	man : String,
	os : Array,
	homepage : String,
	license : String,
	repository : Object,
	description : String,
	keywords : Array,
	version : String,
	dependencies : String
});

module.exports = mongoose.model( 'Package', PackageSchema );