var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var CourseSchema = new Schema({
	coursekey: { type: String, required: true},
    coursename: { type: String, required: true},
    courselang: { type: String, required: true},
    created: {type: Date, required: true, default: Date.now},
    last_modified: {type: Date, required: true, default: Date.now},
}); 

module.exports = mongoose.model('Course', CourseSchema)

