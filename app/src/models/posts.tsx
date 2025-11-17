// src/models/posts.ts
import { Schema, model, models } from "mongoose";

/** Comment sub-schema */
const CommentSchema = new Schema(
  { text: { type: String, required: true } },
  { timestamps: true }
);

/** Post schema */
const PostSchema = new Schema(
  {
    user: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    avatar: { type: String, required: true },
    likes: { type: Number, default: 0 },
    comments: { type: [CommentSchema], default: [] },
    shares: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/** create model if not exists (safe for HMR) */
const PostModel = (models.Post as any) || model("Post", PostSchema);

/** export both default and named (defensive) */
export { PostModel as Post };
export default PostModel;
