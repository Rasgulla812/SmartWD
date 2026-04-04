const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Register a user
exports.registerUser = async (req, res) => {
    const { name, username, email, password } = req.body;

    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });

        if (user) {
            return res.status(400).json({ msg: 'User already exists with this email or username' });
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
                if (err) throw err;
                res.status(201).json({ token });
            }
        );
    } catch (err) {
        console.error("AUTH ERROR:", err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Authenticate user & get token
exports.loginUser = async (req, res) => {
    const { identifier, password } = req.body;

    try {
        let user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

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
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error("AUTH ERROR:", err);
        res.status(500).json({ msg: 'Server error' });
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
