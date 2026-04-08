const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Register a user
exports.registerUser = async (req, res) => {
    const { name, username, email, password } = req.body;

    // Check for missing fields
    if (!name || !username || !email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields: name, username, email, and password.' });
    }

    try {
        // Check if username is taken
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'Username is already taken. Please choose another one.' });
        }

        user = new User({
            name,
            username,
            email,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) {
                    console.error("JWT ERROR:", err);
                    return res.status(500).json({ msg: 'Token generation failed' });
                }
                res.status(201).json({ token });
            }
        );
    } catch (err) {
        console.error("AUTH ERROR:", err);
        // Catch specific Mongoose validation or duplicate key errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        res.status(500).json({ msg: 'Server error: ' + (err.message || 'Unknown error') });
    }
};

// @desc    Authenticate user & get token
exports.loginUser = async (req, res) => {
    const { identifier, password } = req.body;
    console.log(`Login attempt received for: ${identifier}`);

    if (!identifier || !password) {
        return res.status(400).json({ msg: 'Please enter all fields (Email/Username and Password)' });
    }

    try {
        // Find user by either email or username
        // Note: If multiple users share an email, findOne will return the first one.
        // Users are encouraged to use their unique username for clarity.
        let user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!user) {
            console.log(`Login failed: User not found (${identifier})`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log(`Login failed: Incorrect password for ${identifier}`);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        if (!process.env.JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables");
            return res.status(500).json({ msg: 'Server configuration error' });
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5 days' },
            (err, token) => {
                if (err) {
                    console.error("JWT ERROR:", err);
                    return res.status(500).json({ msg: 'Token generation failed' });
                }
                console.log(`Login successful: ${identifier}`);
                res.json({ token });
            }
        );
    } catch (err) {
        console.error("LOGIN AUTH ERROR:", err);
        res.status(500).json({ msg: 'Server error during login: ' + (err.message || 'Unknown error') });
    }
};

// @desc    Get logged in user
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error("AUTH ERROR:", err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Request password reset (Simple version: checks if user exists)
exports.requestPasswordReset = async (req, res) => {
    const { identifier } = req.body;
    try {
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        // In a real app, send email with token here. For now, we'll just allow direct reset.
        res.json({ msg: 'User verified. Please enter your new password.' });
    } catch (err) {
        console.error("AUTH ERROR:", err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Reset password
exports.resetPassword = async (req, res) => {
    const { identifier, newPassword } = req.body;
    try {
        // Find user by either email or username. 
        // If they use email, it will reset the first account found with that email.
        // It's safer to use username.
        let user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password reset successful. You can now login.' });
    } catch (err) {
        console.error("AUTH ERROR:", err);
        res.status(500).json({ msg: 'Server error' });
    }
};
