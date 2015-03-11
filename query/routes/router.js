//ROUTER.JS
module.exports = function(router,passport){

		//INDEX
		var index = require('./index')(router,passport);
		var login = require('./login')(router,passport);
		//API
        //require('./api')(router,passport);

};
