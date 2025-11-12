// "use client";

// import React from "react";

// interface NavbarProps {
//   onSearch: (query: string) => void;
//   onCreatePost: () => void;
//   userStats: {
//     totalPosts: number;
//     totalLikes: number;
//     totalConnections: number;
//   };
// }

// const Navbar: React.FC<NavbarProps> = ({ onSearch, onCreatePost, userStats }) => {
//   return (
//     <header className="bg-white shadow-sm border-b border-gray-200">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center py-4">
//           {/* Logo and Search */}
//           <div className="flex items-center space-x-8 flex-1">
//             <div className="flex items-center space-x-2">
//               <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
//               <span className="text-xl font-bold text-gray-800">SocialApp</span>
//             </div>
            
//             {/* Search Bar */}
//             <div className="flex-1 max-w-md">
//               <div className="relative">
//                 <input
//                   type="text"
//                   placeholder="Search posts, people, topics..."
//                   onChange={(e) => onSearch(e.target.value)}
//                   className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//                 <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                   </svg>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* User Stats and Actions */}
//           <div className="flex items-center space-x-6">
//             {/* Stats */}
//             <div className="hidden md:flex items-center space-x-4 text-sm">
//               <div className="text-center">
//                 <div className="font-semibold text-gray-800">{userStats.totalPosts}</div>
//                 <div className="text-gray-500">Posts</div>
//               </div>
//               <div className="text-center">
//                 <div className="font-semibold text-gray-800">{userStats.totalLikes}</div>
//                 <div className="text-gray-500">Likes</div>
//               </div>
//               <div className="text-center">
//                 <div className="font-semibold text-gray-800">{userStats.totalConnections}</div>
//                 <div className="text-gray-500">Connections</div>
//               </div>
//             </div>

//             {/* Create Post Button */}
//             <button
//               onClick={onCreatePost}
//               className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//               </svg>
//               <span className="hidden sm:inline">Create Post</span>
//             </button>

//             {/* User Avatar */}
//             <div className="flex items-center space-x-3">
//               <img
//                 src="/avatars/current-user.jpg"
//                 alt="Your profile"
//                 className="w-8 h-8 rounded-full"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Navbar;