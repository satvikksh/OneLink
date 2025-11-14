'use client';

import { useState } from 'react';
// import ProfileHeader from '../components/ProfileHeader';
import AboutSection from './components/AboutSection';
import ExperienceSection from './components/ExperienceSection';
import EducationSection from './components/EducationSection';
import SkillsSection from './components/SkillsSection';
import StatsSection from './components/StatsSection';
import EditCoverModal from './components/EditCoverModal';
import EditProfilePhotoModal from './components/EditProfilePhotoModal';

export interface UserProfile {
  id: string;
  name: string;
  headline: string;
  location: string;
  about: string;
  email: string;
  phone: string;
  website: string;
  connections: number;
  profileViews: number;
  profileImage: string;
  coverImage: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: 'Satvik Kushwaha',
    headline: 'Senior Software Engineer | React & Next.js Specialist',
    location: 'Bhopal , India',
    about: 'Passionate software engineer with 8+ years of experience building scalable web applications. Specialized in React, Next.js, and TypeScript. Love mentoring junior developers and contributing to open source projects.',
    email: 'satvikksh@zohomail.in',
    phone: '+91 7580915543',
    website: 'satviksgroup.netlify.app',
    connections: 543,
    profileViews: 1287,
    profileImage: '/api/placeholder/150/150',
    coverImage: '/api/placeholder/1200/300'
  });

  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: '1',
      title: 'Senior Software Engineer',
      company: 'Satviksgroup Inc.',
      location: 'Bhopal, India',
      startDate: '2022-03',
      endDate: 'Present',
      current: true,
      description: 'Lead frontend development for customer-facing applications. Mentor junior developers and implement best practices.'
    },
    {
      id: '2',
      title: 'Software Engineer',
      company: 'OneLink Solutions',
      location: 'Pune, India',
      startDate: '2020-01',
      endDate: '2022-02',
      current: false,
      description: 'Developed and maintained React applications. Collaborated with design team to implement responsive UIs.'
    }
  ]);

  const [education, setEducation] = useState<Education[]>([
    {
      id: '1',
      school: 'LNCT group of colleges',
      degree: 'Computer Science',
      field: 'Computer Science',
      startDate: '2024-09',
      endDate: '2027-05',
      current: false
    },
    {
      id: '2',
      school: 'UC Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2014-09',
      endDate: '2018-05',
      current: false
    }
  ]);

  const [skills, setSkills] = useState([
    'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'AWS', 'MongoDB', 'GraphQL'
  ]);

  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showProfilePhotoModal, setShowProfilePhotoModal] = useState(false);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const addExperience = (experience: Omit<Experience, 'id'>) => {
    const newExperience = { ...experience, id: Date.now().toString() };
    setExperiences(prev => [newExperience, ...prev]);
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    setExperiences(prev => prev.map(exp => 
      exp.id === id ? { ...exp, ...updates } : exp
    ));
  };

  const deleteExperience = (id: string) => {
    setExperiences(prev => prev.filter(exp => exp.id !== id));
  };

  const addEducation = (edu: Omit<Education, 'id'>) => {
    const newEducation = { ...edu, id: Date.now().toString() };
    setEducation(prev => [newEducation, ...prev]);
  };

  const updateEducation = (id: string, updates: Partial<Education>) => {
    setEducation(prev => prev.map(edu => 
      edu.id === id ? { ...edu, ...updates } : edu
    ));
  };

  const deleteEducation = (id: string) => {
    setEducation(prev => prev.filter(edu => edu.id !== id));
  };

  const addSkill = (skill: string) => {
    setSkills(prev => [...prev, skill]);
  };

  const deleteSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-700">
        <img 
          src={profile.coverImage} 
          alt="Cover" 
          className="w-full h-full object-cover"
        />
        <button 
          onClick={() => setShowCoverModal(true)}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-full flex items-center gap-2 transition-all"
        >
          <Edit3 size={16} />
          Edit Cover
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {/* <ProfileHeader 
          profile={profile}
          onEditProfilePhoto={() => setShowProfilePhotoModal(true)}
          onUpdateProfile={updateProfile}
        /> */}
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <AboutSection 
              about={profile.about}
              onUpdateAbout={(about) => updateProfile({ about })}
            />
            
            {/* <ExperienceSection 
              experiences={experiences}
              onAddExperience={addExperience}
              onUpdateExperience={updateExperience}
              onDeleteExperience={deleteExperience}
            /> */}
            
            {/* <EducationSection 
              education={education}
              onAddEducation={addEducation}
              onUpdateEducation={updateEducation}
              onDeleteEducation={deleteEducation}
            /> */}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <SkillsSection 
              skills={skills}
              onAddSkill={addSkill}
              onDeleteSkill={deleteSkill}
            />
            
            <StatsSection 
              connections={profile.connections}
              profileViews={profile.profileViews}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditCoverModal 
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        coverImage={profile.coverImage}
        onSave={(coverImage) => updateProfile({ coverImage })}
      />

      <EditProfilePhotoModal 
        isOpen={showProfilePhotoModal}
        onClose={() => setShowProfilePhotoModal(false)}
        profileImage={profile.profileImage}
        onSave={(profileImage) => updateProfile({ profileImage })}
      />
    </div>
  );
};

// Add the missing icons
const Edit3 = (props: any) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

export default ProfilePage;