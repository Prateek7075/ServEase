const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    location: { type: String, required: true },
    requiredServiceType: { type: String, enum: ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Other'], required: true },

    needyId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },

    status: {
        type: String,
        enum: ['Posted', 'Booked', 'Provider Proposal', 'Needy Accepted', 'Declined', 'Cancelled', 'Completed','Provider Accepted'],
        default: 'Posted'
    },
    datePosted: { type: Date, default: Date.now }
});

module.exports = Job = mongoose.model('job', JobSchema);