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
    <section className="flex-1 space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-white p-4 rounded shadow">
          <div className="flex items-center gap-4 mb-2">
            <img src={post.avatar} alt={post.user} className="w-12 h-12 rounded-full" />
            <div>
              <h2 className="font-semibold">{post.user}</h2>
              <p className="text-sm text-gray-500">{post.timestamp}</p>
            </div>
          </div>
          <h3 className="font-semibold mb-1">{post.title}</h3>
          <p className="text-gray-700">{post.content}</p>
        </div>
      ))}
    </section>
  );
};

export default Feed;
