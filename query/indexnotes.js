var config = require('./config/settings').settings;
var notes = require("./notes");
//notes.query();
console.log("FIRST you have to execute gradesByUser then gradesBySemester");
//notes.gradesByUser();
notes.gradesBySemester();