// servease-backend/routes/api/users.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth'); // Import our JWT middleware
const User = require('../../models/User');

// @route   GET api/users/me
// @desc    Get authenticated user details
// @access  Private (Requires JWT token in header)
router.get('/me', auth, async (req, res) => {
    try {
        // req.user.id is set by the auth middleware
        const user = await User.findById(req.user.id).select('-password'); 
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;