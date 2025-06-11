// services/userStorage.js
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/users.json");

// טוען את כל המשתמשים
function loadUsers() {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return []; // אם אין קובץ – מחזיר רשימה ריקה
  }
}

// שומר את כל המשתמשים
function saveUsers(users) {
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf8");
}

// מוצא לפי אימייל
function findUserByEmail(email) {
  const users = loadUsers();
  return users.find((u) => u.email === email);
}

// מוסיף משתמש חדש
function addUser(user) {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
}

module.exports = {
  loadUsers,
  saveUsers,
  findUserByEmail,
  addUser,
};
