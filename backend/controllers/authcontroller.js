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
    console.log('Login attempt received for email:', email);
  
    try {
      const user = await userSchema.findOne({ email });
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        console.log('No user found with this email');
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match:', isMatch ? 'Yes' : 'No');
      
      if (!isMatch) {
        console.log('Password does not match');
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('JWT token generated successfully');
  
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
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };