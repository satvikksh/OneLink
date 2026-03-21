import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

export interface User {
  name: string;
  username: string;
  email: string;
  password: string;
  role: "student" | "institute" | "recruiter" | "creator";
  organizationName?: string | null;
  signature?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IUserDoc = HydratedDocument<User>;

const UserSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
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
    organizationName: {
      type: String,
      default: null,
      trim: true,
      maxlength: 160,
    },
    password: { type: String, required: true, select: false },
    signature: {
      type: String,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "institute", "recruiter", "creator"],
      default: "student",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        if (ret) {
          delete (ret as Record<string, unknown>).password;
          delete (ret as Record<string, unknown>).signature;
        }
        return ret;
      },
    },
  }
);

UserSchema.pre("validate", function normalize(next) {
  const doc = this as IUserDoc;
  if (typeof doc.name === "string") doc.name = doc.name.trim();
  if (typeof doc.username === "string") {
    doc.username = doc.username.trim().toLowerCase();
  }
  if (typeof doc.email === "string") {
    doc.email = doc.email.trim().toLowerCase();
  }
  if (typeof doc.organizationName === "string") {
    doc.organizationName = doc.organizationName.trim();
  }
  next();
});

const UserModel: Model<User> =
  (mongoose.models.User as Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModel;
