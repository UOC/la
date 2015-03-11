var mongoose = require('mongoose');

module.exports = (function() {

	var connected = false;

	return {
		connect: function(connectionString) {
			if (!connected) {
				connectionString = connectionString || 'mongodb://localhost/lrs';
				mongoose.connect(connectionString);
				connected = true;	
			}
		},
		is_connected: function() {
			return connected;
		}
	};
}());