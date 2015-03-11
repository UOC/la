var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var UserCourseSchema = new Schema({
	course: {type: Schema.ObjectId, required: true, ref: 'Course'},
	user: {type: Schema.ObjectId, required: true, ref: 'User'},
	roles: {type: String, required: true},
	is_instructor: {type: Boolean, required: true, default: false},
	is_admin: {type: Boolean, required: true, default: false},
	is_student: {type: Boolean, required: true, default: false},
    created: {type: Date, required: true, default: Date.now},
    last_modified: {type: Date, required: true, default: Date.now},
}); 

module.exports = mongoose.model('UserCourse', UserCourseSchema);

