"use client";

import React, { useState, useMemo, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "remote";
  salary: string;
  description: string;
  requirements: string[];
  postedDate: string;
  applicants: number;
  logo: string;
  featured?: boolean;
  easyApply?: boolean;
  urgent?: boolean;
}

interface JobApplication {
  jobId: string;
  name: string;
  email: string;
  resume: File | null;
  coverLetter: string;
  appliedDate: string;
}

const JobsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "saved" | "applications">("all");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "" as string,
    location: "",
    salary: "",
    remote: false
  });
  const [currentPage, setCurrentPage] = useState("jobs");
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    name: "",
    email: "",
    resume: null as File | null,
    coverLetter: ""
  });
  const router = useRouter();

  // Mock job data
  const initialJobs: Job[] = [
    {
      id: "1",
      title: "Senior Frontend Developer",
      company: "TechCorp",
      location: "San Francisco, CA",
      type: "full-time",
      salary: "$120,000 - $150,000",
      description: "We are looking for an experienced Frontend Developer to join our growing team. You will be responsible for building responsive web applications using modern technologies.",
      requirements: ["5+ years of React experience", "TypeScript proficiency", "CSS/SCSS expertise", "Experience with state management"],
      postedDate: "2 days ago",
      applicants: 24,
      logo: "/logos/techcorp.jpg",
      featured: true,
      easyApply: true
    },
    {
      id: "2",
      title: "UX/UI Designer",
      company: "DesignStudio",
      location: "Remote",
      type: "remote",
      salary: "$90,000 - $110,000",
      description: "Join our design team to create beautiful and intuitive user interfaces for our products. You'll work closely with product managers and developers.",
      requirements: ["3+ years of UX/UI design", "Figma expertise", "User research experience", "Portfolio required"],
      postedDate: "1 week ago",
      applicants: 18,
      logo: "/logos/designstudio.jpg",
      easyApply: true
    },
    {
      id: "3",
      title: "Backend Engineer",
      company: "DataSystems",
      location: "New York, NY",
      type: "full-time",
      salary: "$130,000 - $160,000",
      description: "We need a skilled Backend Engineer to develop and maintain our scalable infrastructure. Experience with microservices architecture is a plus.",
      requirements: ["Node.js/Python experience", "Database design skills", "API development", "Cloud services (AWS/Azure)"],
      postedDate: "3 days ago",
      applicants: 31,
      logo: "/logos/datasystems.jpg",
      urgent: true
    },
    {
      id: "4",
      title: "Product Manager",
      company: "InnovateLabs",
      location: "Austin, TX",
      type: "full-time",
      salary: "$110,000 - $140,000",
      description: "Lead product development from conception to launch. Work with cross-functional teams to deliver exceptional products.",
      requirements: ["5+ years product management", "Agile methodology", "Data analysis skills", "Technical background"],
      postedDate: "5 days ago",
      applicants: 15,
      logo: "/logos/innovatelabs.jpg",
      featured: true
    },
    {
      id: "5",
      title: "DevOps Engineer",
      company: "CloudTech",
      location: "Remote",
      type: "remote",
      salary: "$100,000 - $130,000",
      description: "Manage and optimize our cloud infrastructure. Implement CI/CD pipelines and ensure system reliability.",
      requirements: ["Docker/Kubernetes", "CI/CD tools", "Infrastructure as Code", "Monitoring systems"],
      postedDate: "1 day ago",
      applicants: 22,
      logo: "/logos/cloudtech.jpg",
      easyApply: true
    },
    {
      id: "6",
      title: "Data Scientist",
      company: "AI Solutions",
      location: "Boston, MA",
      type: "full-time",
      salary: "$115,000 - $145,000",
      description: "Apply machine learning techniques to solve complex business problems. Work with large datasets and build predictive models.",
      requirements: ["Python/R programming", "Machine learning frameworks", "Statistical analysis", "SQL proficiency"],
      postedDate: "4 days ago",
      applicants: 28,
      logo: "/logos/aisolutions.jpg"
    },
    {
      id: "7",
      title: "Mobile Developer",
      company: "AppWorks",
      location: "Los Angeles, CA",
      type: "full-time",
      salary: "$95,000 - $125,000",
      description: "Develop cross-platform mobile applications using React Native. Collaborate with design team to implement pixel-perfect UIs.",
      requirements: ["React Native experience", "iOS/Android development", "JavaScript/TypeScript", "REST APIs"],
      postedDate: "6 days ago",
      applicants: 19,
      logo: "/logos/appworks.jpg",
      easyApply: true
    },
    {
      id: "8",
      title: "Part-time Content Writer",
      company: "ContentCreators",
      location: "Remote",
      type: "part-time",
      salary: "$45 - $65 per hour",
      description: "Create engaging technical content for our blog and documentation. Work with subject matter experts to produce high-quality articles.",
      requirements: ["Technical writing experience", "SEO knowledge", "Portfolio of work", "Tech industry familiarity"],
      postedDate: "2 weeks ago",
      applicants: 12,
      logo: "/logos/contentcreators.jpg"
    }
  ];

  // Initialize data
  useEffect(() => {
    setJobs(initialJobs);
    // Load saved jobs and applications from localStorage
    const saved = localStorage.getItem("savedJobs");
    const apps = localStorage.getItem("jobApplications");
    if (saved) setSavedJobs(JSON.parse(saved));
    if (apps) setApplications(JSON.parse(apps));
  }, []);

  // Handle page navigation
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    
    switch(page) {
      case "home":
        router.push("/");
        break;
      case "network":
        router.push(`/?page=${page}`, { scroll: true });
        break;
      case "jobs":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      case "chat":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      case "notifications":
        router.push(`/?page=${page}`, { scroll: false });
        break;
      case "profile":
         router.push(`/?page=${page}`, { scroll: false });
        break;
      default:
        router.push("/");
    }
  };

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Job type filter
    if (filters.type) {
      filtered = filtered.filter(job => job.type === filters.type);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Remote filter
    if (filters.remote) {
      filtered = filtered.filter(job => job.type === "remote");
    }

    return filtered;
  }, [jobs, searchQuery, filters]);

  // Get saved jobs
  const savedJobsList = useMemo(() => {
    return jobs.filter(job => savedJobs.includes(job.id));
  }, [jobs, savedJobs]);

  // Get applied jobs
  const appliedJobs = useMemo(() => {
    const appliedJobIds = applications.map(app => app.jobId);
    return jobs.filter(job => appliedJobIds.includes(job.id));
  }, [jobs, applications]);

  // Save/unsave job
  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSaved = prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId];
      
      localStorage.setItem("savedJobs", JSON.stringify(newSaved));
      return newSaved;
    });
  };

  // Open application modal
  const openApplication = (job: Job) => {
    setSelectedJob(job);
    setApplicationForm({
      name: "John Doe", // Pre-fill with user data
      email: "john.doe@example.com",
      resume: null,
      coverLetter: `I am excited to apply for the ${job.title} position at ${job.company}.`
    });
    setShowApplicationModal(true);
  };

  // Submit application
  const submitApplication = () => {
    if (!selectedJob) return;

    const newApplication: JobApplication = {
      jobId: selectedJob.id,
      name: applicationForm.name,
      email: applicationForm.email,
      resume: applicationForm.resume,
      coverLetter: applicationForm.coverLetter,
      appliedDate: new Date().toISOString()
    };

    setApplications(prev => {
      const newApplications = [...prev, newApplication];
      localStorage.setItem("jobApplications", JSON.stringify(newApplications));
      return newApplications;
    });

    setShowApplicationModal(false);
    setSelectedJob(null);
    alert(`Application submitted for ${selectedJob.title} at ${selectedJob.company}`);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreatePost = () => {
    console.log("Create post clicked");
  };

  // Mock user stats
  const userStats = {
    totalPosts: 15,
    totalLikes: 124,
    totalConnections: 423
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onPageChange={handlePageChange}
        currentPage={currentPage}
        onSearch={handleSearch}
        onCreatePost={handleCreatePost}
        userStats={userStats}
      />
      
      <div className="pt-28 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs</h1>
            <p className="text-gray-600">Find your next career opportunity</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
                
                {/* Job Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>

                {/* Location */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="City, State, or Remote"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Remote Only */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.remote}
                      onChange={(e) => setFilters(prev => ({ ...prev, remote: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remote Only</span>
                  </label>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => setFilters({ type: "", location: "", salary: "", remote: false })}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search Bar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="border-b border-gray-200">
                  <div className="flex space-x-8 px-6">
                    {[
                      { key: "all", label: "All Jobs", count: filteredJobs.length },
                      { key: "saved", label: "Saved Jobs", count: savedJobsList.length },
                      { key: "applications", label: "My Applications", count: applications.length }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`py-4 border-b-2 transition-colors flex items-center space-x-2 ${
                          activeTab === tab.key
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                          <span className="bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-1">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jobs List */}
                <div className="p-6">
                  {activeTab === "all" && (
                    <div className="space-y-4">
                      {filteredJobs.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No jobs found matching your criteria.</p>
                        </div>
                      ) : (
                        filteredJobs.map(job => (
                          <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4 flex-1">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                                  {job.company.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                    {job.featured && (
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Featured</span>
                                    )}
                                    {job.urgent && (
                                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Urgent</span>
                                    )}
                                  </div>
                                  <p className="text-gray-600">{job.company} • {job.location}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                    <span className="capitalize">{job.type.replace('-', ' ')}</span>
                                    <span>{job.salary}</span>
                                    <span>{job.postedDate}</span>
                                    <span>{job.applicants} applicants</span>
                                  </div>
                                  <p className="text-gray-700 mt-3 line-clamp-2">{job.description}</p>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {job.requirements.slice(0, 3).map((req, index) => (
                                      <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                        {req}
                                      </span>
                                    ))}
                                    {job.requirements.length > 3 && (
                                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                        +{job.requirements.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2 ml-4">
                                <button
                                  onClick={() => toggleSaveJob(job.id)}
                                  className={`p-2 rounded-full ${
                                    savedJobs.includes(job.id)
                                      ? "text-red-500 hover:bg-red-50"
                                      : "text-gray-400 hover:bg-gray-100"
                                  }`}
                                >
                                  <svg className="w-5 h-5" fill={savedJobs.includes(job.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                </button>
                                {job.easyApply ? (
                                  <button
                                    onClick={() => openApplication(job)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors text-sm font-medium"
                                  >
                                    Easy Apply
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openApplication(job)}
                                    className="border border-blue-500 text-blue-500 px-4 py-2 rounded-full hover:bg-blue-50 transition-colors text-sm font-medium"
                                  >
                                    Apply
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "saved" && (
                    <div className="space-y-4">
                      {savedJobsList.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No saved jobs.</p>
                        </div>
                      ) : (
                        savedJobsList.map(job => (
                          <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4 flex-1">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                                  {job.company.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                  <p className="text-gray-600">{job.company} • {job.location}</p>
                                  <p className="text-gray-700 mt-2">{job.description}</p>
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2 ml-4">
                                <button
                                  onClick={() => toggleSaveJob(job.id)}
                                  className="p-2 rounded-full text-red-500 hover:bg-red-50"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => openApplication(job)}
                                  className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors text-sm font-medium"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "applications" && (
                    <div className="space-y-4">
                      {applications.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No applications submitted.</p>
                        </div>
                      ) : (
                        applications.map((application, index) => {
                          const job = jobs.find(j => j.id === application.jobId);
                          if (!job) return null;
                          
                          return (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                                    {job.company.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                    <p className="text-gray-600">{job.company} • {job.location}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Applied on {new Date(application.appliedDate).toLocaleDateString()}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Application Submitted</span>
                                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Under Review</span>
                                    </div>
                                  </div>
                                </div>
                                <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                                  View Application
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Apply for {selectedJob.title}</h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={applicationForm.name}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={applicationForm.email}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
                  <input
                    type="file"
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, resume: e.target.files?.[0] || null }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.doc,.docx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                  <textarea
                    value={applicationForm.coverLetter}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={submitApplication}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Submit Application
                  </button>
                  <button
                    onClick={() => setShowApplicationModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;