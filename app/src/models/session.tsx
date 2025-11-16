// src/models/session.ts
import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  sid: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // <-- ref
  deviceKey: { type: String },
  ua: { type: String },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  meta: { type: mongoose.Schema.Types.Mixed },
});

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.models.Session || mongoose.model("Session", SessionSchema);
export default Session;
