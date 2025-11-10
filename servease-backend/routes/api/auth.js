// servease-backend/routes/api/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const sendEmail = require('../../utils/emailSender');
const User = require('../../models/User');

// === 1. REGISTRATION ROUTE ===
// @route   POST api/auth/register
// @desc    Register Needy or Provider User
// @access  Public
router.post(
    '/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
        check('role', 'Role (Needy/Provider) is required').isIn(['Needy', 'Provider']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, role, serviceType, location, mobileNumber } = req.body;

        try {
            let user = await User.findOne({ email });

            // Check if user already exists
            if (user) {
                return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
            }

            // Create new user instance
            user = new User({
                name,
                email,
                password, 
                role,
                // Use a spread operator to conditionally add provider fields
                ...(role === 'Provider' && { serviceType, location, mobileNumber })
            });

            // Hash password before saving
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            const emailContent = `
                    <h1>Welcome to Servease!</h1>
                    <p>Hi ${name},</p>
                    <p>Your ${role} account has been successfully registered.</p>
                    <p>You can now log in and start connecting!</p>`;
            sendEmail(email, 'Servease: Registration Successful', emailContent);
            
            // Create JWT Payload
            const payload = {
                user: {
                    id: user.id,
                    role: user.role
                }
            };

            // Sign and return the token
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5 days' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, role: user.role });
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);


// === 2. LOGIN ROUTE ===
// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            // Compare entered password with stored hashed password
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            // Create and return JWT
            const payload = {
                user: {
                    id: user.id,
                    role: user.role
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '5 days' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, role: user.role, id: user.id });
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;