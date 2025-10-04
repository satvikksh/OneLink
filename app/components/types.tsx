export interface Post {
  id: number;
  user: string;
  title: string;
  content: string;
  avatar: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
}

export interface User {
  id?: number;
  name: string;
  title: string;
  avatar: string;
  profileViews?: number;
  postImpressions?: number;
  mutualConnections?: number;
}

export interface Connection {
  id: number;
  name: string;
  title: string;
  avatar: string;
  online: boolean;
}