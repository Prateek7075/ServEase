// servease-backend/routes/api/jobs.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth'); 
const sendEmail = require('../../utils/emailSender');
const Job = require('../../models/Job');
const User = require('../../models/User'); // Needed to verify the user role

// Helper function to handle email sending (wrapped for safety)
const sendNotification = (to, subject, content) => {
    try {
        sendEmail(to, subject, content);
    } catch (emailError) {
        // Log the error but don't crash the API response
        console.error(`Email failed to send to ${to}:`, emailError.message);
    }
};

// === 1. POST JOB ROUTE ===
// @route   POST api/jobs/post
// @desc    Needy user posts a new job request
// @access  Private (Needs auth, must be 'Needy' role)
router.post(
    '/post',
    [
        auth, // Ensure user is logged in
        [ // Validation checks for the job fields
            check('title', 'Title is required').not().isEmpty(),
            check('description', 'Description is required').not().isEmpty(),
            check('budget', 'A budget price (in Rupees) is required').isNumeric(),
            check('location', 'Location is required').not().isEmpty(),
            check('requiredServiceType', 'Valid service type is required').isIn(['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Other']),
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // CRITICAL CHECK: Ensure only Needy users can post jobs
            const user = await User.findById(req.user.id).select('role');
            if (user.role !== 'Needy') {
                return res.status(403).json({ msg: 'Authorization denied: Only Needy users can post jobs.' });
            }

            const { title, description, budget, location, requiredServiceType } = req.body;

            const newJob = new Job({
                needyId: req.user.id, // ID is taken from the JWT payload
                title,
                description,
                budget,
                location,
                requiredServiceType,
                status: 'Posted', // Default status for public posts
                providerId: null, // No provider linked yet
            });

            const job = await newJob.save();
            res.json(job);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// === 2. PROVIDER ACCEPTS OR PROPOSES JOB ===
// @route   PUT api/jobs/:job_id/respond
// @desc    Provider accepts a direct booking or sends a proposal for a posted job
// @access  Private (Needs auth, must be 'Provider' role)
router.put(
    '/:job_id/respond',
    [
        auth,
        // Require action in the body. Frontend must provide this.
        check('action', 'Action must be Proposal, Accept, or Cancel').isIn(['Proposal', 'Accept', 'Cancel']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { action } = req.body;
        const providerUser = await User.findById(req.user.id).select('role name serviceType email'); // Fetch all provider details

        try {   
            if (providerUser.role !== 'Provider') return res.status(403).json({ msg: 'Authorization denied.' });

            let job = await Job.findById(req.params.job_id).populate('needyId', ['name', 'email']);
            if (!job) return res.status(404).json({ msg: 'Job not found' });
            
            let newStatus;
            let emailSubject;
            let emailContent;
            
            // Logic based on requested action and current job status
            if (action === 'Proposal') {
                if (job.status !== 'Posted') return res.status(400).json({ msg: 'Job is not posted.' });
                
                newStatus = 'Provider Proposal';
                job.providerId = providerUser._id; // Assign provider for proposal review
                
                emailSubject = `Job Proposal Sent: ${job.title}`;
                emailContent = `<h1>Proposal Sent!</h1><p>Hi ${job.needyId.name}, Provider **${providerUser.name}** has sent a proposal for **${job.title}**. Review it on your dashboard.</p>`;
                
            } else if (action === 'Accept' || action === 'Cancel') {
                if (job.status !== 'Booked') return res.status(400).json({ msg: `Job is not pending direct booking.` });
                
                if (!job.providerId || job.providerId.toString() !== providerUser._id.toString()) {
                    return res.status(403).json({ msg: 'Job not assigned to this provider.' });
                }
                // --- CRITICAL RESTORATION: ACCEPT LOGIC ---
                if (action === 'Accept') { //accept
                    newStatus = 'Provider Accepted';
                    emailSubject = `Booking CONFIRMED: ${job.title}`;
                    emailContent = `<h1>Booking Confirmed!</h1><p>Hi ${job.needyId.name}, **${providerUser.name}** has ACCEPTED your direct booking for **${job.title}**.</p>`; 
                }
                else if (action === 'Cancel'){ // Cancel
                    newStatus = 'Cancelled'; // Unassign and return to the pool
                    job.providerId = null;
                    emailSubject = `Booking CANCELLED by Provider: ${job.title}`;
                    emailContent = `<h1>Booking Cancelled</h1><p>Hi ${job.needyId.name}, **${providerUser.name}** has CANCELED the booking for **${job.title}**.</p>`;
                }
            } else {
                 return res.status(400).json({ msg: 'Invalid action.' });
            }

            job.status = newStatus;
            await job.save();

            
            try { 
                // Only attempt to send if an email subject was set (i.e., action was Accept/Cancel/Proposal)
                if (emailSubject) { 
                    await sendEmail(job.needyId.email, emailSubject, emailContent);
                }
            } catch (emailError) {
                // LOG THE ERROR but DO NOT rethrow, so the API can return status 200/OK.
                console.error(`Email failed after successful DB update for job ${job._id}:`, emailError.message);
            }
            
            res.json(job);

        } catch (err) {
            console.error('Provider Response Error:', err.message);
            // If the error reached here, it's a critical DB/Auth crash, so return 500
            if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Job not found' });
            res.status(500).send('Server Error');
        }
    }
);

// === 3. GET NEEDY DASHBOARD JOBS ===
// @route   GET api/jobs/needy
// @desc    Get all jobs posted by the current Needy user
// @access  Private (Needs auth, must be 'Needy' role)
router.get(
    '/needy',
    auth,
    async (req, res) => {
        try {
            // CRITICAL CHECK 1: Ensure user is a Needy
            const user = await User.findById(req.user.id).select('role');
            if (user.role !== 'Needy') {
                return res.status(403).json({ msg: 'Authorization denied: Only Needy users can view this dashboard.' });
            }
            
            const jobs = await Job.find({ needyId: req.user.id })
                .sort({ datePosted: -1 }) // Sort newest first
                .populate('providerId', ['name', 'serviceType', 'hourlyRate']); // Get provider details

            res.json(jobs);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// === 4. NEEDY ACCEPTS/DECLINES/CANCELS JOB ===
// @route   PUT api/jobs/:job_id/status
// @desc    Needy updates the status of their job (Accept, Decline, Cancel)
// @access  Private (Needs auth, must be 'Needy' role)
router.put(
    '/:job_id/status',
    [ auth, check('newStatus', 'A valid status update is required').isIn(['Needy Accepted', 'Declined', 'Cancelled']), ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        
        const { newStatus } = req.body;
        
        try {
            // Fetch the user performing the action (the Needy user)
            const needyUser = await User.findById(req.user.id).select('name'); 
            let job = await Job.findById(req.params.job_id);

            if (!job) return res.status(404).json({ msg: 'Job not found' });
            if (job.needyId.toString() !== req.user.id) return res.status(403).json({ msg: 'Authorization denied: Not the job owner.' });
            
            // Check: Needy can only accept if status is 'Provider Proposal'
            if (newStatus === 'Needy Accepted' && job.status !== 'Provider Proposal') {
                return res.status(400).json({ msg: 'Cannot accept. Job must be in Proposal status.' });
            }
            
            // Update core job status
            job.status = newStatus;

            // --- NOTIFICATION LOGIC ---
            if (job.providerId) {
                const provider = await User.findById(job.providerId).select('name email');
                const subject = `Job Finalized: ${job.title}`;
                
                let statusMessage = '';
                if (newStatus === 'Needy Accepted') {
                    statusMessage = '<p style="color: green;">The job has been accepted and is ready to begin!</p>';
                } else if (newStatus === 'Cancelled') {
                    statusMessage = '<p style="color: red;">The job has been CANCELLED by the Needy user.</p>';
                } else if (newStatus === 'Declined') {
                    statusMessage = '<p style="color: orange;">Your proposal was DECLINED by the Needy user.</p>';
                }

                const emailContent = `
                    <h1>Job Status Update</h1><p>Hi ${provider.name},</p>
                    <p>The Needy user **${needyUser.name}** has updated the status of the job: **${job.title}**.</p>
                    <p>New Status: <b>${newStatus}</b></p>${statusMessage}`;
                
                // CRITICAL: Prevent API from crashing if email send fails
                try { 
                    sendNotification(provider.email, subject, emailContent);
                } catch (emailError) {
                    console.error('Email failed to send during status update:', emailError.message);
                }
            }
            
            // --- CANCELLATION DATA CLEANUP (Corrected) ---
            if (newStatus === 'Declined' || newStatus === 'Cancelled') {
                 job.providerId = null; 
                 // DO NOT revert job.status to 'Posted'. 
                 // The 'Cancelled' status hides it from both dashboards and job searching.
                 // The status remains 'Cancelled' as set above: job.status = newStatus;
            }

            await job.save();
            res.json(job);

        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Job not found' });
            res.status(500).send('Server Error');
        }
    }
);


// === 5. NEEDY DIRECT BOOKING ROUTE ===
// @route   POST api/jobs/book
// @desc    Needy user directly books a specific provider
// @access  Private (Needs auth, must be 'Needy' role)
router.post(
    '/book',
    [
        auth, // Ensure user is logged in
        [ // Validation checks
            check('title', 'Title is required').not().isEmpty(),
            check('description', 'Description is required').not().isEmpty(),
            check('budget', 'A budget price is required').isNumeric(),
            check('location', 'Location is required').not().isEmpty(),
            check('providerId', 'Provider ID is required for direct booking').isMongoId(),
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            // CRITICAL CHECK 1: Ensure user is a Needy
            const needyUser = await User.findById(req.user.id).select('role name email');
            if (needyUser.role !== 'Needy') {
                return res.status(403).json({ msg: 'Authorization denied: Only Needy users can book jobs.' });
            }

            const { title, description, budget, location, providerId } = req.body;

            // CRITICAL CHECK 2: Verify the target Provider
            const provider = await User.findById(providerId).select('name email role isOpenForJobs serviceType');
            if (!provider || provider.role !== 'Provider' || !provider.isOpenForJobs) {
                 return res.status(404).json({ msg: 'Provider is invalid or currently unavailable.'});
            }
            
            // Get the service type from the Provider's profile
            const requiredServiceType = provider.serviceType || 'Other'; 

            const newJob = new Job({
                needyId: req.user.id,
                providerId: providerId,
                title,
                description,
                budget,
                location,
                requiredServiceType,
                status: 'Booked', // Status indicates a direct booking, waiting for provider acceptance
            });

            const job = await newJob.save();

            // --- NOTIFICATION LOGIC (CRITICAL ADDITION) ---
            const emailSubject = `NEW Direct Booking Request: ${job.title}`;
            const emailContent = `
                <h1>Direct Booking Received!</h1>
                <p>Hello ${provider.name},</p>
                <p>A Needy user, **${needyUser.name}** (${needyUser.email}), has directly booked you for the job: <b>${job.title}</b>.</p>
                <p>Please log in to your dashboard to **Accept** or **Cancel** the booking immediately.</p>
            `;
            
            try {
                 sendEmail(provider.email, emailSubject, emailContent);
            } catch (emailError) {
                console.error(`❌ Email send failed for job ${job._id}:`, emailError.message);
            }
        
            res.json(job);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// === 6. PROVIDER MARKS JOB AS COMPLETED ===
// @route   PUT api/jobs/:job_id/complete
// @desc    Provider marks an accepted job as completed
// @access  Private (Needs auth, must be 'Provider' role)
router.put(
    '/:job_id/complete',
    auth,
    async (req, res) => {
        try {
            // Find job
            let job = await Job.findById(req.params.job_id);

            if (!job) return res.status(404).json({ msg: 'Job not found' });
            
            // CRITICAL CHECK 1: Ensure user is a Provider
            const user = await User.findById(req.user.id).select('role');
            if (user.role !== 'Provider') {
                return res.status(403).json({ msg: 'Authorization denied: Only Providers can complete jobs.' });
            }

            // CRITICAL CHECK 2: Ensure the provider is the one assigned to the job
            if (job.providerId.toString() !== req.user.id) {
                return res.status(403).json({ msg: 'Authorization denied: Not the assigned provider for this job.' });
            }

            // CRITICAL CHECK 3: Ensure the job is in a state that can be completed
            const allowedStatuses = ['Provider Accepted', 'Needy Accepted'];
            if (!allowedStatuses.includes(job.status)) {
                 return res.status(400).json({ msg: `Job status (${job.status}) must be accepted before it can be marked completed.` });
            }

            // Update status to Completed
            job.status = 'Completed';
            // --- NEW: NOTIFY NEEDY USER & PROMPT REVIEW ---
            const needy = await User.findById(job.needyId).select('name email');
            const provider = await User.findById(job.providerId).select('name');
            const subject = `Job Completed: ${job.title} - Submit Review!`;
            const content = `
                <h1>Job Completed!</h1>
                <p>Hi ${needy.name},</p>
                <p>**${provider.name}** has marked the job **${job.title}** as completed.</p>
                <p style="color: blue;">Please log in to your dashboard to confirm completion and leave a rating and review!</p>
                <p>Thank you for using Servease.</p>
            `;
            sendEmail(needy.email, subject, content);
            await job.save();

            res.json(job);

        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Job not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);

// === 7. GET PROVIDER DASHBOARD JOBS ===
// @route   GET api/jobs/provider
// @desc    Get all jobs assigned to the current Provider
// @access  Private (Needs auth, must be 'Provider' role)
router.get(
    '/provider',
    auth,
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('role');
            if (user.role !== 'Provider') {
                return res.status(403).json({ msg: 'Authorization denied: Must be a Provider.' });
            }
            
            // Find jobs where the logged-in user is the assigned provider
            const jobs = await Job.find({ providerId: req.user.id })
                // Filter out jobs that are already completed or cancelled for a cleaner dashboard view
                .where('status').nin(['Completed', 'Cancelled']) 
                .sort({ datePosted: 1 }) // Show oldest (likely most urgent) first
                .populate('needyId', ['name', 'location', 'mobileNumber']); // Get Needy contact info

            res.json(jobs);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


module.exports = router;