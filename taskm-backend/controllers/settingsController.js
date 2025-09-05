const AppDataSource = require('../data-source');
const User = require('../entities/User');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, refresh_token, ...out } = user;
    res.json(out);
  } catch (err) {
    console.error('getProfile error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password } = req.body;
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email && email !== user.email) {
      // ensure unique
      const exists = await repo.findOneBy({ email });
      if (exists && exists.id !== userId) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      user.password = hash;
    }
    await repo.save(user);
    const { password: _p, refresh_token, ...out } = user;
    res.json(out);
  } catch (err) {
    console.error('updateProfile error', err);
    res.status(500).json({ message: 'Server error' });
  }
};


