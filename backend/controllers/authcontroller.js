const bcrypt = require('bcryptjs');
const userSchema = require('../models/user');
const jwt = require('jsonwebtoken');

exports.register = async(req,res) => {
    const {UserName , email, password} = req.body;
    const hashed = await bcrypt.hash(password,10);
    const user = await userSchema.create({UserName,email, password: hashed});
    res.status(200).json(user);
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await userSchema.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
  
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          UserName: user.UserName,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };