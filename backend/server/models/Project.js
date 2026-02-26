// devfolio/server/models/Project.js
const { Schema, model } = require('mongoose');

const FileSchema = new Schema({
  name: String,
  mime: String,
  size: Number,
  path: String,       // storage key within Supabase bucket
  publicUrl: String,  // public CDN URL
}, { _id: false });

const ProjectSchema = new Schema({
  title:       { type: String, required: true, maxlength: 120 },
  description: { type: String, maxlength: 1000 },
  skills:      { type: [String], default: [] },
  links: {
    github:   String,
    demo:     String,
    linkedin: String,
  },
  files: { type: [FileSchema], default: [] },
}, { timestamps: true });

module.exports = model('Project', ProjectSchema);
