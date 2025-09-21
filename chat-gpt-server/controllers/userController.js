const {
  findUserByEmail,
  addUser,
} = require("../services/userService");
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

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

  // Generate course dates (6 months from now)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 6);

  const user = {
    id: "user_" + Math.random().toString(36).substring(2, 10),
    name,
    email,
    course: course || 'theory', // ✅ Single course field
    courseDates: {
      startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
      endDate: endDate.toISOString().split('T')[0] // YYYY-MM-DD format
    }
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

  // Generate JWT token
  const token = jwt.sign(
    { id: existingUser.id, email: existingUser.email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.status(200).json({ user: existingUser, token });
};
