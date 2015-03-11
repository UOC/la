var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ActivitySchema = new Schema({
	course: {type: Schema.ObjectId, ref: 'Course', required: true},
	resourcekey: { type: String, required: true},
    resourcename: { type: String, required: true},
    created: {type: Date, required: true, default: Date.now},
    last_modified: {type: Date, required: true, default: Date.now},
}); 

module.exports = mongoose.model('Activity', ActivitySchema)

