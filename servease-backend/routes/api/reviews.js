// servease-backend/routes/api/reviews.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth'); 

const Review = require('../../models/Review');
const User = require('../../models/User');
const Job = require('../../models/Job');

// @route   POST api/reviews
// @desc    Needy user submits a rating/review for a completed job
// @access  Private (Needs auth, must be 'Needy' role)
router.post(
    '/',
    [
        auth,
        check('jobId', 'Job ID is required').isMongoId(),
        check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { jobId, rating, comment } = req.body;
        const needyId = req.user.id;

        try {
            // 1. Verify Job Status and Ownership
            const job = await Job.findById(jobId);
            if (!job || job.needyId.toString() !== needyId) {
                return res.status(404).json({ msg: 'Job not found or access denied.' });
            }
            if (job.status !== 'Completed') {
                return res.status(400).json({ msg: 'Cannot review a job that is not completed.' });
            }
            if (!job.providerId) {
                 return res.status(400).json({ msg: 'Job has no assigned provider.' });
            }

            // 2. Check for existing review
            const existingReview = await Review.findOne({ jobId });
            if (existingReview) {
                return res.status(400).json({ msg: 'This job has already been reviewed.' });
            }

            // 3. Create Review
            const newReview = new Review({
                jobId,
                needyId,
                providerId: job.providerId,
                rating,
                comment: comment || '',
            });
            await newReview.save();

            // 4. Update Provider's Average Rating (Aggregation Logic)
            const provider = await User.findById(job.providerId);
            
            // Calculate new average
            const newTotalReviews = provider.totalReviews + 1;
            const newAverageRating = (
                (provider.averageRating * provider.totalReviews) + rating
            ) / newTotalReviews;

            provider.averageRating = parseFloat(newAverageRating.toFixed(1));
            provider.totalReviews = newTotalReviews;

            await provider.save();

            res.json(newReview);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// Optional: Route to get a provider's reviews (for their public page)
router.get('/:providerId', async (req, res) => {
    try {
        const reviews = await Review.find({ providerId: req.params.providerId })
            .populate('needyId', ['name']) // Show who wrote the review
            .sort({ datePosted: -1 });
        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;