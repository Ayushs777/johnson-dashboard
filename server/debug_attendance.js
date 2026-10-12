require('dotenv').config();
const { getAttendanceData } = require('./services/googleSheetsService');

getAttendanceData('E25691').then(d => {
  console.log('Records found:', d.length);
  d.forEach(r => console.log(r.date, '|', r.status));
}).catch(e => console.error('ERROR:', e.message));
