// convertUserProgress.js
const fs = require('fs');
const path = require('path');
const progressPath = path.join(__dirname, 'userProgress.json');

const data = require(progressPath);

if (Array.isArray(data)) {
  const obj = {};
  data.forEach(u => {
    if (u.userId) obj[u.userId] = u;
  });
  fs.writeFileSync(progressPath, JSON.stringify(obj, null, 2));
  console.log('userProgress.json converted to object format!');
} else {
  console.log('userProgress.json is already in object format.');
} 