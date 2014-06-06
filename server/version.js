
function Version ( str ) {
	console.log(str)
	this.strRepr = str;
	this.arrayRepr = str.split( "." ).map( Number )
	this.length = this.arrayRepr.length;
};

Version.prototype = {

	get : function ( i ) {
		return this.arrayRepr[i] || 0;
	},

	// returns 1 if v is less
	// -1 if v is greater
	// 0 if same
	cmp : function ( v ) {
		v = ( v instanceof Version ? v : new Version( v ) );

		for ( var i=0; i < Math.max( v.length, this.length ); i++ ) {
			console.log(v.get(i),this.get(i))
			if ( v.get(i) > this.get(i) )
				return -1
			else if ( v.get(i) < this.get(i) )
				return 1
			else {
				continue;
			}		
		}
		return 0;
	},

	equals : function ( v ) {
		return ( this.cmp(v) == 0 ? true : false )
	},

	newer : function ( v ) {
		return ( this.cmp(v) > 0 ? true : false )
	}

};


module.exports = Version;