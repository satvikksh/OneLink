// import { useState } from 'react';
// import { MapPin, Mail, Phone, Globe, Users, Edit3, Plus} from 'lucide-react';
// import { UserProfile } from '../api/socket/profile/page';
// import EditContactModal from './EditContactModal';

// interface ProfileHeaderProps {
//   profile: UserProfile;
//   onEditProfilePhoto: () => void;
//   onUpdateProfile: (updates: Partial<UserProfile>) => void;
// }

// const ProfileHeader = ({ profile, onEditProfilePhoto, onUpdateProfile }: ProfileHeaderProps) => {
//   const [showContactModal, setShowContactModal] = useState(false);

//   const handleConnect = () => {
//     onUpdateProfile({ connections: profile.connections + 1 });
//     // In a real app, you would send a connection request
//     alert('Connection request sent!');
//   };

//   const handleMessage = () => {
//     // In a real app, this would open a messaging interface
//     alert('Opening messaging interface...');
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6">
//       <div className="flex flex-col md:flex-row md:items-start gap-6">
//         {/* Profile Image */}
//         <div className="flex-shrink-0 -mt-24 md:-mt-20">
//           <div className="relative">
//             <img 
//               src={profile.profileImage} 
//               alt={profile.name}
//               className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg object-cover"
//             />
//             <button 
//               onClick={onEditProfilePhoto}
//               className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
//             >
//               <Edit3 size={14} />
//             </button>
//           </div>
//         </div>

//         {/* Profile Info */}
//         <div className="flex-1">
//           <div className="flex flex-col md:flex-row md:items-start md:justify-between">
//             <div>
//               <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
//                 {profile.name}
//               </h1>
//               <p className="text-lg text-gray-600 mt-1">
//                 {profile.headline}
//               </p>
//               <div className="flex items-center gap-1 text-gray-500 mt-2">
//                 <MapPin size={16} />
//                 <span>{profile.location}</span>
//               </div>
//               <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
//                 <div className="flex items-center gap-1">
//                   <Users size={16} />
//                   <span>{profile.connections.toLocaleString()} connections</span>
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <Eye size={16} />
//                   <span>{profile.profileViews.toLocaleString()} profile views</span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex gap-3 mt-4 md:mt-0">
//               <button 
//                 onClick={handleConnect}
//                 className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
//               >
//                 <Plus size={16} />
//                 Connect
//               </button>
//               {/* <button 
//                 onClick={handleMessage}
//                 className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2"
//               >
//                 <onMessage size={16} />
//                 Message
//               </button> */}
//             </div>
//           </div>

//           {/* Contact Info */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-300">
//             <div className="flex items-center gap-2 text-gray-700">
//               <Mail size={16} />
//               <span>{profile.email}</span>
//             </div>
//             <div className="flex items-center gap-2 text-gray-700">
//               <Phone size={16} />
//               <span>{profile.phone}</span>
//             </div>
//             <div className="flex items-center gap-2 text-gray-700">
//               <Globe size={16} />
//               <span>{profile.website}</span>
//             </div>
//             <div className="md:col-span-3 flex justify-end">
//               <button 
//                 onClick={() => setShowContactModal(true)}
//                 className="text-blue-700 hover:text-blue-700 text-sm flex items-center gap-2"
//               >
//                 <Edit3 size={14} />
//                 Edit Contact Info
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <EditContactModal 
//         isOpen={showContactModal}
//         onClose={() => setShowContactModal(false)}
//         profile={profile}
//         onSave={onUpdateProfile}
//       />
//     </div>
//   );
// };

// const Eye = (props: any) => (
//   <svg
//     {...props}
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
//     <circle cx="12" cy="12" r="3" />
//   </svg>
// );

// export default ProfileHeader;