const {
  findUserByEmail,
  addUser,
} = require("../services/userService");

exports.register = (req, res) => {
  const { name, email, course } = req.body;

  console.log('📝 Registration request received:');
  console.log('  Name:', name);
  console.log('  Email:', email);
  console.log('  Course:', course);

  if (!name || !email) {
    return res.status(400).json({ error: "יש להזין שם ואימייל" });
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: "משתמש עם אימייל זה כבר קיים" });
  }

  const user = {
    id: "user_" + Math.random().toString(36).substring(2, 10),
    name,
    email,
    course: course || 'theory', // ✅ Single course field
  };

  console.log('💾 Saving user with course:', user);

  addUser(user);

  res.status(201).json({ user });
};
exports.login = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "יש להזין אימייל" });
  }

  const existingUser = findUserByEmail(email);
  if (!existingUser) {
    return res.status(404).json({ error: "משתמש לא קיים" });
  }

  res.status(200).json({ user: existingUser });
};
