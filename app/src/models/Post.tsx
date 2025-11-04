import { Schema, model, models } from "mongoose";

const CommentSchema = new Schema(
  {
    text: { type: String, required: true },
  },
  { _id: true, timestamps: true }
);

const PostSchema = new Schema(
  {
    user: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    avatar: { type: String, required: true },
    likes: { type: Number, default: 0 },
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true }
);

// Next.js dev me multiple model compile error avoid:
export const Post = models.Post || model("Post", PostSchema);

export type PostDoc = {
  _id: string;
  user: string;
  title: string;
  content: string;
  avatar: string;
  likes: number;
  comments: { _id: string; text: string; createdAt: string; updatedAt: string }[];
  createdAt: string;
  updatedAt: string;
};
