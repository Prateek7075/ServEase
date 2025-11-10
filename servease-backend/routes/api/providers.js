// servease-backend/routes/api/providers.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Job = require('../../models/Job');

// === 1. UPDATE PROVIDER PROFILE ===
// @route   PUT api/providers/profile
// @desc    Update provider settings (rate, availability, openForJobs)
// @access  Private (Needs auth, must be 'Provider' role)
router.put(
    '/profile',
    auth, // Requires token
    async (req, res) => {
        // Optional: Add express-validator checks here if needed, e.g., check('hourlyRate').isNumeric()

        const { hourlyRate, availableDays, isOpenForJobs, location } = req.body;
        
        try {
            // Find user and ensure they are a Provider
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            }
            if (user.role !== 'Provider') {
                return res.status(403).json({ msg: 'Authorization denied: Only Providers can update this profile.' });
            }

            // Build the update object dynamically
            const profileFields = {};
            if (hourlyRate !== undefined) profileFields.hourlyRate = hourlyRate;
            if (availableDays !== undefined) profileFields.availableDays = availableDays;
            if (isOpenForJobs !== undefined) profileFields.isOpenForJobs = isOpenForJobs;
            if (location) profileFields.location = location;


            // Update the user profile in the database
            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { $set: profileFields },
                { new: true } // Return the updated document
            ).select('-password');

            res.json(updatedUser);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// === 2. BROWSE POSTED JOBS ROUTE ===
// @route   GET api/providers/jobs
// @desc    Provider views all available posted jobs matching their serviceType
// @access  Private (Needs auth, must be 'Provider' role)
router.get(
    '/jobs',
    auth, // Requires token
    async (req, res) => {
        try {
            // 1. Get the Provider's service type
            const provider = await User.findById(req.user.id).select('role serviceType isOpenForJobs');

            if (!provider || provider.role !== 'Provider') {
                return res.status(403).json({ msg: 'Authorization denied: Must be a Service Provider.' });
            }
            
            // Optional: Check if the provider is accepting jobs
            if (!provider.isOpenForJobs) {
                 return res.status(200).json([]); // Return empty list if they are not open for jobs
            }

            // 2. Query for matching jobs
            const jobs = await Job.find({
                requiredServiceType: provider.serviceType, // Match the provider's service
                status: 'Posted', // Only show jobs that are currently posted and unassigned
                // Optional: Filter out jobs where the Needy user is the provider's ID (shouldn't happen, but good safeguard)
                needyId: { $ne: req.user.id } 
            })
            .sort({ datePosted: -1 }) // Show newest jobs first
            .populate('needyId', ['name', 'location']); // Get Needy name and location for display

            res.json(jobs);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// === 3. GET ALL AVAILABLE PROVIDERS (FOR NEEDY HOME) ===
// @route   GET api/providers/available
// @desc    Get a list of all providers who are open for jobs
// @access  Private (Needs auth, 'Needy' role recommended but only checking login for now)
router.get(
    '/available',
    auth, // Only need to be logged in
    async (req, res) => {
        try {
            const providers = await User.find({
                role: 'Provider',
                isOpenForJobs: true // Only show providers who are currently accepting jobs
            }).select('-password'); // Exclude sensitive info

            // Optional: You might want to filter only specific fields for the card view
            res.json(providers);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   GET api/providers/analytics/me
// @desc    Get provider earnings, completed job count, and all reviews
// @access  Private (Provider role)
router.get(
    '/analytics/me',
    auth,
    async (req, res) => {
        const providerIdString = req.user.id;

        try {
            if (!providerIdString) {
                 throw new Error("Provider ID not found in token payload.");
            }
            
            const providerId = new mongoose.Types.ObjectId(providerIdString);;

            // 1. Calculate Earnings and Job Count (Aggregation)
            const stats = await Job.aggregate([
                { $match: { providerId: providerId, status: 'Completed' } },
                {
                    $group: {
                        _id: null,
                        totalEarning: { $sum: '$budget' }, // Sum the budget of all completed jobs
                        completedJobsCount: { $sum: 1 }
                    }
                }
            ]);

            // 2. Fetch Detailed Reviews
            const reviews = await Review.find({ providerId: providerId })
                .populate('needyId', ['name'])
                .sort({ datePosted: -1 });

            // 3. Fetch Job History (Completed Jobs)
            const jobHistory = await Job.find({ providerId: providerId, status: 'Completed' })
                .select('title budget datePosted')
                .sort({ datePosted: -1 });

            const result = {
                // Return 0 if no jobs completed
                totalEarning: stats.length > 0 ? stats[0].totalEarning : 0,
                completedJobsCount: stats.length > 0 ? stats[0].completedJobsCount : 0,
                reviews,
                jobHistory
            };

            res.json(result);

        } catch (err) {
            console.error('Analytics Fetch Error:', err.message); // Log error clearly in backend
            res.status(500).send('Server Error: Failed to retrieve provider analytics.');
        }
    }
);

module.exports = router;