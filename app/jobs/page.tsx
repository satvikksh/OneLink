"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type InstitutionType = "college" | "school";

interface Institution {
  _id: string;
  institutionType: InstitutionType;
  name: string;
  city: string;
  state: string;
  country?: string;
  addressLine1?: string;
  addressLine2?: string;
  zipCode?: string;
  email?: string;
  phone?: string;
  website?: string;
  establishedYear?: number;
  totalStudents?: number;
  headName?: string;
  accreditation?: string;
  courses?: string[];
  facilities?: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface InstitutionsResponse {
  institutions?: Institution[];
  error?: string;
}

const JobsPage: React.FC = () => {
  const [selectedKind, setSelectedKind] = useState<"all" | InstitutionType>("all");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/institutions", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data: InstitutionsResponse = await res.json().catch(() => ({}));
        if (!active) return;

        if (!res.ok) {
          setError(data?.error || "Failed to load institutions.");
          setInstitutions([]);
          return;
        }

        const list = Array.isArray(data?.institutions) ? data.institutions : [];
        setInstitutions(list);
        setSelectedId((prev) => prev ?? (list[0]?._id || null));
      } catch {
        if (active) {
          setError("Failed to load institutions.");
          setInstitutions([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filteredInstitutions = useMemo(() => {
    if (selectedKind === "all") return institutions;
    return institutions.filter((item) => item.institutionType === selectedKind);
  }, [institutions, selectedKind]);

  const selectedInstitution = useMemo(
    () => institutions.find((item) => item._id === selectedId) ?? null,
    [institutions, selectedId]
  );

  return (
    <div className="pt-5 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Colleges & Schools</h1>
            <p className="text-gray-600">Select a college or school to view its profile and details.</p>
          </div>
          <Link
            href="/institutions/new"
            className="w-fit px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Add New Institution
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Select type</p>
          <div className="flex flex-wrap gap-3">
            <button
              className={`px-4 py-2 rounded-lg border ${selectedKind === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}
              onClick={() => setSelectedKind("all")}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-lg border ${selectedKind === "college" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}
              onClick={() => setSelectedKind("college")}
            >
              College
            </button>
            <button
              className={`px-4 py-2 rounded-lg border ${selectedKind === "school" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}
              onClick={() => setSelectedKind("school")}
            >
              School
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-4 sm:p-5 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Profiles</h2>
            <div className="space-y-2">
              {loading && <p className="text-sm text-gray-500">Loading institutions...</p>}
              {!loading && error && <p className="text-sm text-red-600">{error}</p>}

              {filteredInstitutions.map((item) => (
                <button
                  key={item._id}
                  onClick={() => setSelectedId(item._id)}
                  className={`w-full text-left border rounded-lg p-3 transition-colors ${
                    selectedId === item._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.institutionType === "college" ? "College" : "School"} - {item.city}, {item.state}
                  </p>
                </button>
              ))}

              {!loading && !error && filteredInstitutions.length === 0 && (
                <p className="text-sm text-gray-500">No listed colleges or schools found.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5 sm:p-6">
            {!selectedInstitution ? (
              <div className="h-full min-h-[260px] flex items-center justify-center text-gray-500 text-center">
                Click a college or school from the list to view profile details.
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedInstitution.name}</h3>
                    <p className="text-gray-600 mt-1">
                      {selectedInstitution.institutionType === "college" ? "College" : "School"} - {selectedInstitution.city}, {selectedInstitution.state}
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium uppercase">
                    {selectedInstitution.institutionType}
                  </span>
                </div>

                <p className="text-gray-700 mb-5">
                  {selectedInstitution.description || "No description available."}
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Established</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedInstitution.establishedYear || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Students</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {typeof selectedInstitution.totalStudents === "number"
                        ? selectedInstitution.totalStudents.toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Programs</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedInstitution.courses || []).map((program) => (
                      <span
                        key={program}
                        className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {program}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Website</p>
                  {selectedInstitution.website ? (
                    <a
                      href={selectedInstitution.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline break-all"
                    >
                      {selectedInstitution.website}
                    </a>
                  ) : (
                    <p className="text-gray-500">N/A</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
