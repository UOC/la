for(var year = 1900; year < 2015; year++) {
  var start = new Date(year, 1, 1);
  var end = new Date(year, 12, 31);

  db.people.update(
    { birthdate: {$gte: start, $lt: end}},
    { $set: {birthdate: NumberInt(year)}},
    { multi: true }
  );
}
