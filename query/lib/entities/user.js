var mongoose = require('mongoose'),
	crypto = require('crypto'),
	uuid = require('node-uuid'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
    userkey: { type: String, required: true, unique: true },
	fullname: { type: String, required: true },
    email: { type: String, required: true, unique: false},
	actual_name: { type: String, required: false },
	activation_key: {type: String, required: false, default: function () {
		return uuid.v4().replace(/-/g,'')+uuid.v4().replace(/-/g,'');
	}},
	activated: {type: Boolean, required: false, default: true},
	salt: { type: String, required: true, default: uuid.v1 },
	passwdHash: { type: String, required: true },
	created: {type: Date, required: false, default: Date.now},
	last_access: {type: Date, required: false, default: Date.now},
	
});

var hash = function(passwd, salt) {
	return crypto.createHmac('sha256', salt).update(passwd).digest('hex');
};

UserSchema.methods.setPassword = function(passwordString) {
	this.passwdHash = hash(passwordString, this.salt);
};

UserSchema.methods.validatePassword = function(passwordString) {
	var reslt = (this.passwdHash === hash(passwordString, this.salt));
	//var reslt = reslt && (this.activated === true);
	console.log(reslt);
	console.log(this);
	return reslt;
};

module.exports = mongoose.model('User', UserSchema);