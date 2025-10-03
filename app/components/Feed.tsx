"use client";

import React from "react";
import { Post } from "./types";

interface FeedProps {
  posts: Post[];
  onLike: (postId: number) => void;
  onComment: (postId: number, comment: string) => void;
  onShare: (postId: number) => void;
}

const Feed: React.FC<FeedProps> = ({ posts, onLike, onComment, onShare }) => {
  const handleCommentSubmit = (postId: number, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const comment = formData.get("comment") as string;
    if (comment.trim()) {
      onComment(postId, comment);
      e.currentTarget.reset();
    }
  };

  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No posts found. Try a different search or filter.</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Post Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <img
                  src={post.avatar}
                  alt={post.user}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{post.user}</h3>
                  <p className="text-sm text-gray-500">{post.timestamp}</p>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-4">
              <h4 className="font-bold text-lg mb-2">{post.title}</h4>
              <p className="text-gray-700">{post.content}</p>
            </div>

            {/* Post Stats */}
            <div className="px-4 py-2 border-t border-gray-100 text-sm text-gray-500 flex gap-4">
              <span>{post.likes} likes</span>
              <span>{post.comments} comments</span>
              <span>{post.shares} shares</span>
            </div>

            {/* Post Actions */}
            <div className="px-4 py-2 border-t border-gray-100 flex justify-between">
              <button
                onClick={() => onLike(post.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  post.isLiked 
                    ? "text-red-500 hover:text-red-600" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>❤️</span>
                <span>{post.isLiked ? "Liked" : "Like"}</span>
              </button>

              <button
                onClick={() => {
                  const comment = prompt("Enter your comment:");
                  if (comment) onComment(post.id, comment);
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span>💬</span>
                <span>Comment</span>
              </button>

              <button
                onClick={() => onShare(post.id)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
              >
                <span>🔄</span>
                <span>Share</span>
              </button>
            </div>

            {/* Comment Input */}
            <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="p-4 border-t border-gray-100">
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="comment"
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        ))
      )}
    </div>
  );
};

export default Feed;