"use client";

import React, { useState } from "react";

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("posts");

  const userData = {
    name: "Your Name",
    title: "Software Developer",
    location: "San Francisco, CA",
    connections: 423,
    followers: 1250,
    avatar: "/avatars/current-user.jpg",
    background: "/backgrounds/profile-bg.jpg",
    about: "Passionate software developer with 5+ years of experience in building scalable web applications. Specialized in React, Node.js, and cloud technologies.",
    experience: [
      {
        id: 1,
        title: "Senior Software Engineer",
        company: "TechCorp Inc.",
        period: "2022 - Present",
        description: "Leading frontend development team and architecting scalable solutions."
      },
      {
        id: 2,
        title: "Software Engineer",
        company: "StartUpXYZ",
        period: "2020 - 2022",
        description: "Developed and maintained customer-facing web applications."
      }
    ],
    education: [
      {
        id: 1,
        degree: "Bachelor of Computer Science",
        school: "University of Technology",
        period: "2016 - 2020"
      }
    ],
    skills: ["JavaScript", "React", "Node.js", "TypeScript", "AWS", "MongoDB", "Python"]
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            <button className="absolute top-4 right-4 bg-white text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
              Edit Cover Photo
            </button>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-6">
            <div className="flex justify-between items-start -mt-16 mb-4">
              <div className="flex items-end space-x-6">
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-32 h-32 rounded-full border-4 border-white"
                />
                <div className="pb-4">
                  <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                  <p className="text-lg text-gray-600">{userData.title}</p>
                  <p className="text-gray-500">{userData.location}</p>
                  <div className="flex space-x-4 mt-2 text-sm text-gray-600">
                    <span>{userData.connections} connections</span>
                    <span>{userData.followers} followers</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-medium">
                  Connect
                </button>
                <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-50 transition-colors font-medium">
                  Message
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors">
                  ...
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { key: "posts", label: "Posts" },
                { key: "about", label: "About" },
                { key: "experience", label: "Experience" },
                { key: "education", label: "Education" },
                { key: "skills", label: "Skills" }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "posts" && (
              <div className="text-center py-8">
                <p className="text-gray-500">Your posts will appear here</p>
              </div>
            )}

            {activeTab === "about" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">About</h3>
                <p className="text-gray-700 leading-relaxed">{userData.about}</p>
              </div>
            )}

            {activeTab === "experience" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Experience</h3>
                <div className="space-y-4">
                  {userData.experience.map(exp => (
                    <div key={exp.id} className="border-l-2 border-blue-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                      <p className="text-gray-600">{exp.company} • {exp.period}</p>
                      <p className="text-gray-700 mt-1">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "education" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Education</h3>
                <div className="space-y-4">
                  {userData.education.map(edu => (
                    <div key={edu.id} className="border-l-2 border-green-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <p className="text-gray-600">{edu.school} • {edu.period}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "skills" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {userData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Posted about new project • 2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Connected with Sarah Johnson • 1 day ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Shared a post • 2 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;