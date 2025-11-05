// models/User.ts
import mongoose, { Schema, Model, HydratedDocument } from "mongoose";

/** 1) Types */
export interface User {
  name: string;
  username: string;
  email: string;
  password: string; // bcrypt hash stored here
  role: "student" | "recruiter" | "creator";
  createdAt?: Date;
  updatedAt?: Date;
}
export type IUserDoc = HydratedDocument<User>;

/** 2) Schema */
const UserSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]{3,20}$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    // bcrypt hash — never return by default
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "recruiter", "creator"],
      default: "student",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        // cleanup output
        // delete ret.password;
        return ret;
      },
    },
  }
);

/** 3) Indexes (ensure uniqueness at DB level too) */
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });

/** 4) Defensive normalization */
UserSchema.pre("validate", function (next) {
  const doc = this as IUserDoc;
  if (typeof doc.name === "string") doc.name = doc.name.trim();
  if (typeof doc.username === "string")
    doc.username = doc.username.trim().toLowerCase();
  if (typeof doc.email === "string")
    doc.email = doc.email.trim().toLowerCase();
  next();
});

/** 5) Model (safe with Next.js HMR) */
const User: Model<User> =
  (mongoose.models.User as Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default User;
