const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Needy', 'Provider'], required: true },
    
    // Provider Specific Fields
    averageRating: {type: Number,default: 0},
    totalReviews: {type: Number,default: 0},
    serviceType: { type: String, enum: ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Other'], default: null },
    location: { type: String, default: null },
    mobileNumber: { type: String, default: null },
    hourlyRate: { type: Number, default: 0 },
    availableDays: { type: [String], default: [] },
    isOpenForJobs: { type: Boolean, default: true },
    date: { type: Date, default: Date.now }
});

module.exports = User = mongoose.model('user', UserSchema);