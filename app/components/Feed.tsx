// src/components/Feed.tsx
import React from "react";

interface Post {
  id: number;
  user: string;
  title: string;
  content: string;
  avatar: string;
  timestamp: string;
}

interface FeedProps {
  posts: Post[];
}

const Feed: React.FC<FeedProps> = ({ posts }) => {
  return (
    <div className="flex-1 bg-white p-4 rounded shadow">
      {posts.map((post) => (
        <div key={post.id} className="mb-4 border-b pb-2">
          <div className="flex items-center gap-2">
            <img src={post.avatar} alt={post.user} className="w-8 h-8 rounded-full" />
            <div>
              <h3 className="font-semibold">{post.user}</h3>
              <span className="text-xs text-gray-500">{post.timestamp}</span>
            </div>
          </div>
          <h4 className="mt-2 font-bold">{post.title}</h4>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
};

export default Feed;
