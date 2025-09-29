// File: src/app/jobs/page.tsx
"use client";

import React, { useState } from "react";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  posted: string;
  description: string;
}

const jobsData: Job[] = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "TechCorp",
    location: "Bhopal, India",
    posted: "2 days ago",
    description: "We are looking for a skilled React/Next.js developer.",
  },
  {
    id: 2,
    title: "Backend Developer",
    company: "Innovatech",
    location: "Indore, India",
    posted: "5 days ago",
    description: "Looking for a Node.js/Express developer with database experience.",
  },
  {
    id: 3,
    title: "UI/UX Designer",
    company: "DesignPro",
    location: "Mumbai, India",
    posted: "1 week ago",
    description: "Design engaging user interfaces for web and mobile applications.",
  },
];

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>(jobsData);
  const [searchTerm, setSearchTerm] = useState("");

  const handleApply = (job: Job) => {
    alert(`You have applied for ${job.title} at ${job.company}`);
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Jobs</h1>

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search jobs by title or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded shadow focus:outline-none focus:ring focus:border-blue-500"
        />
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div>
                <h2 className="font-semibold text-lg">{job.title}</h2>
                <p className="text-gray-500">{job.company} - {job.location}</p>
                <p className="text-sm text-gray-400">{job.posted}</p>
                <p className="mt-2 text-gray-700">{job.description}</p>
              </div>
              <button
                onClick={() => handleApply(job)}
                className="mt-3 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No jobs found</p>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
