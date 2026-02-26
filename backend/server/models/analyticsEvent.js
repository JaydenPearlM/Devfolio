// server/models/AnalyticsEvent.js
const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: ['pageview', 'project_click', 'resume_click', 'load_time', 'session_end', 'error'],
      required: true,
      index: true,
    },

    // Present only for project clicks
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },

    // Performance / session
    // For eventType: 'load_time'
    loadTimeMs: { type: Number, default: null },
    // For eventType: 'session_end'
    sessionSec: { type: Number, default: null },

    // Client error fields (for eventType: 'error')
    errorName:    { type: String, default: null },
    errorMessage: { type: String, default: null },
    errorStack:   { type: String, default: null },
    path:         { type: String, default: null },

    // Used by aggregations (projectsPerDay, range filters)
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    userAgent: { type: String, default: null },
  },
  { versionKey: false }
);

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
