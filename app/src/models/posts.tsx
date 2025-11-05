import { Schema, model, models } from "mongoose";

const CommentSchema = new Schema(
  { text: { type: String, required: true } },
  { timestamps: true }
);

const PostSchema = new Schema(
  {
    user: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    avatar: { type: String, required: true },
    likes: { type: Number, default: 0 },
    comments: { type: [CommentSchema], default: [] }
  },
  { timestamps: true }
);

export const Post = models.Post || model("Post", PostSchema);
