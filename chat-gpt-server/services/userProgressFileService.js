const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/userProgress.json');

function readData() {
  if (!fs.existsSync(DATA_PATH)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function findByUserId(userId) {
  const data = readData();
  return data.find(p => p.userId === userId);
}

function saveProgress(progress) {
  const data = readData();
  const idx = data.findIndex(p => p.userId === progress.userId);
  if (idx !== -1) {
    data[idx] = progress;
  } else {
    data.push(progress);
  }
  writeData(data);
}

module.exports = {
  findByUserId,
  saveProgress,
}; 