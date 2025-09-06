// authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppDataSource = require('../data-source');
const User = require('../entities/User');

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

exports.register = async (req, res) => {
  const { name, username, email, password, role, avatar } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password required' });

  const userRepository = AppDataSource.getRepository(User);

  try {
    const existingByEmail = await userRepository.findOneBy({ email });
    if (existingByEmail) return res.status(409).json({ message: 'Email already exists' });

    if (username) {
      const existingByUsername = await userRepository.findOneBy({ username });
      if (existingByUsername) return res.status(409).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = userRepository.create({
      name,
      username: username || null,
      email,
      password: hashedPassword,
      role,
      avatar,
    });
    await userRepository.save(newUser);

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Store hashed refresh token
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    newUser.refreshToken = hashedRefresh;
    await userRepository.save(newUser);

    setRefreshCookie(res, refreshToken);

    const resp = {
      token: accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        avatar: newUser.avatar,
      },
    };

    if (process.env.NODE_ENV !== 'production') resp.refreshToken = refreshToken;

    res.status(201).json(resp);
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ message: 'Identifier and password required' });

  const userRepository = AppDataSource.getRepository(User);

  try {
    let user;
    if (identifier.includes('@')) {
      user = await userRepository.findOneBy({ email: identifier });
    } else {
      user = await userRepository.findOneBy({ username: identifier });
    }

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefresh;
    await userRepository.save(user);

    setRefreshCookie(res, refreshToken);

    const resp = {
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      },
    };

    if (process.env.NODE_ENV !== 'production') resp.refreshToken = refreshToken;

    res.json(resp);
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.token;
  if (!token) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: payload.id });
    if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

    const valid = user.refreshToken ? await bcrypt.compare(token, user.refreshToken) : false;
    if (!valid) return res.status(403).json({ message: 'Invalid refresh token' });

    const newRefreshToken = generateRefreshToken(user);
    const newHashed = await bcrypt.hash(newRefreshToken, 10);
    user.refreshToken = newHashed;
    await userRepository.save(user);

    setRefreshCookie(res, newRefreshToken);

    const accessToken = generateAccessToken(user);

    res.json({
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Error refreshing token:', err);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.token;
  if (!token) return res.status(400).json({ message: 'Refresh token required' });

  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: payload.id });
    if (user) {
      user.refreshToken = null;
      await userRepository.save(user);
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Error during logout:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
