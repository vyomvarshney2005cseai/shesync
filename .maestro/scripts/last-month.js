// Sets output.first / output.last to the 3rd and 7th of last month (YYYY-MM-DD),
// matching the calendar's day testIDs (day-YYYY-MM-DD).
var d = new Date();
d.setDate(1);
d.setMonth(d.getMonth() - 1);
function two(n) {
  return (n < 10 ? '0' : '') + n;
}
var prefix = d.getFullYear() + '-' + two(d.getMonth() + 1) + '-';
output.first = prefix + '03';
output.last = prefix + '07';
