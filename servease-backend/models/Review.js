// servease-backend/models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    providerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    needyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    jobId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'job', 
        required: true,
        unique: true // Ensure only one review per job
    },
    rating: { // The score (e.g., 1 to 5)
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    comment: { // The text description
        type: String, 
        maxlength: 500 
    },
    datePosted: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = Review = mongoose.model('Review', ReviewSchema);