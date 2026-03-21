"use client";

import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  COMPARE_CHANGED_EVENT,
  emitClientEvent,
} from "../../src/lib/clientEvents";
import { COMPARE_STORAGE_KEY } from "../../src/lib/theme";
import type { AppUser, Institution } from "../../src/types/education";

type Filters = {
  search: string;
  location: string;
  course: string;
  facility: string;
  maxFees: string;
  minRating: string;
  type: "all" | "college" | "school";
};

const emptyFilters: Filters = {
  search: "",
  location: "",
  course: "",
  facility: "",
  maxFees: "",
  minRating: "",
  type: "all",
};

export default function StudentDiscovery() {
  const router = useRouter();
  const [viewer, setViewer] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const deferredFilters = useDeferredValue(filters);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeInstitution, setActiveInstitution] = useState<Institution | null>(
    null
  );
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [preferredCourse, setPreferredCourse] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : [];
      if (Array.isArray(saved)) {
        setSelectedIds(saved.filter((item): item is string => typeof item === "string"));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {}

    emitClientEvent(COMPARE_CHANGED_EVENT, {
      count: selectedIds.length,
    });
  }, [selectedIds]);

  useEffect(() => {
    async function hydrateViewer() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          router.replace("/students/login?next=/students/discover");
          return;
        }

        const data = await response.json();
        if (data?.user?.role === "institute") {
          router.replace("/institutes/dashboard");
          return;
        }

        setViewer(data.user);
        setAuthReady(true);
      } catch {
        router.replace("/students/login?next=/students/discover");
      }
    }

    hydrateViewer();
  }, [router]);

  useEffect(() => {
    if (!authReady) return;

    const controller = new AbortController();

    async function fetchInstitutions() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (deferredFilters.search) params.set("search", deferredFilters.search);
        if (deferredFilters.location) {
          params.set("location", deferredFilters.location);
        }
        if (deferredFilters.course) params.set("course", deferredFilters.course);
        if (deferredFilters.facility) {
          params.set("facility", deferredFilters.facility);
        }
        if (deferredFilters.maxFees) params.set("maxFees", deferredFilters.maxFees);
        if (deferredFilters.minRating) {
          params.set("minRating", deferredFilters.minRating);
        }
        if (deferredFilters.type !== "all") {
          params.set("type", deferredFilters.type);
        }

        const response = await fetch(`/api/institutions?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data?.error || "Unable to load institutions.");
          setInstitutions([]);
          return;
        }

        setInstitutions(data.institutions || []);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setError("Unable to load institutions right now.");
          setInstitutions([]);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchInstitutions();

    return () => controller.abort();
  }, [authReady, deferredFilters]);

  const selectedInstitutions = useMemo(
    () => institutions.filter((institution) => selectedIds.includes(institution._id)),
    [institutions, selectedIds]
  );

  const summary = useMemo(() => {
    const topRated = institutions[0];
    const averageFee =
      institutions.length > 0
        ? Math.round(
            institutions.reduce((sum, institution) => sum + institution.annualFees, 0) /
              institutions.length
          )
        : 0;

    return {
      total: institutions.length,
      topRated: topRated ? `${topRated.name} (${topRated.rating.toFixed(1)})` : "No matches yet",
      averageFee:
        averageFee > 0 ? `₹${averageFee.toLocaleString("en-IN")}` : "Not enough data",
    };
  }, [institutions]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleCompare = (institutionId: string) => {
    setSelectedIds((current) => {
      if (current.includes(institutionId)) {
        return current.filter((item) => item !== institutionId);
      }

      if (current.length >= 3) {
        setNotice("You can compare up to 3 institutions at once.");
        return current;
      }

      return [...current, institutionId];
    });
  };

  async function sendInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeInstitution) return;

    if (!inquiryMessage.trim()) {
      setError("Please write a short inquiry before sending.");
      return;
    }

    setSendingInquiry(true);
    setError(null);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          institutionId: activeInstitution._id,
          message: inquiryMessage,
          preferredCourse,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || "Unable to send inquiry.");
        return;
      }

      setNotice(`Inquiry sent to ${activeInstitution.name}.`);
      setInquiryMessage("");
      setPreferredCourse("");
      setActiveInstitution(null);
    } catch {
      setError("Network error while sending your inquiry.");
    } finally {
      setSendingInquiry(false);
    }
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel rounded-[2rem] px-8 py-6 text-sm text-slate-600">
          Loading your student workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Student Discovery Hub
              </p>
              <h1 className="heading-serif mt-3 text-4xl text-slate-900 sm:text-5xl">
                Explore institutions with sharper filters and a clean compare
                view
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Welcome back{viewer?.name ? `, ${viewer.name}` : ""}. Search
                schools and colleges by city, fees, ratings, facilities, and
                courses, then compare the options that deserve a closer look.
              </p>
            </div>

          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { label: "Matches", value: summary.total.toString() },
              { label: "Top rated right now", value: summary.topRated },
              {
                label: "Average listed annual fees",
                value: summary.averageFee,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200/80 bg-white/80 p-5"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            <input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search by name or keyword"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none xl:col-span-2"
            />
            <input
              value={filters.location}
              onChange={(event) => updateFilter("location", event.target.value)}
              placeholder="City or state"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
            />
            <input
              value={filters.course}
              onChange={(event) => updateFilter("course", event.target.value)}
              placeholder="Course"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
            />
            <input
              value={filters.facility}
              onChange={(event) => updateFilter("facility", event.target.value)}
              placeholder="Facility"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
            />
            <input
              value={filters.maxFees}
              onChange={(event) => updateFilter("maxFees", event.target.value)}
              placeholder="Max annual fees"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
              <select
                value={filters.minRating}
                onChange={(event) => updateFilter("minRating", event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
              >
                <option value="">Min rating</option>
                <option value="3">3.0+</option>
                <option value="3.5">3.5+</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
              </select>
              <select
                value={filters.type}
                onChange={(event) => updateFilter("type", event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
              >
                <option value="all">All types</option>
                <option value="college">Colleges</option>
                <option value="school">Schools</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <button
              type="button"
              onClick={() => setFilters(emptyFilters)}
              className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-slate-700"
            >
              Reset filters
            </button>
            <p className="rounded-full bg-[rgba(32,85,72,0.1)] px-4 py-2 text-[var(--forest)]">
              Compare up to 3 institutions
            </p>
          </div>
        </section>

        {selectedInstitutions.length > 0 ? (
          <section className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Compare View
                </p>
                <h2 className="heading-serif mt-2 text-3xl text-slate-900">
                  Shortlisted institutions side by side
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-700"
              >
                Clear compare
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="rounded-l-3xl bg-slate-100 px-4 py-3 text-slate-500">
                      Criteria
                    </th>
                    {selectedInstitutions.map((institution, index) => (
                      <th
                        key={institution._id}
                        className={`bg-slate-100 px-4 py-3 text-slate-800 ${
                          index === selectedInstitutions.length - 1
                            ? "rounded-r-3xl"
                            : ""
                        }`}
                      >
                        {institution.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: "Location",
                      render: (institution: Institution) =>
                        `${institution.city}, ${institution.state}`,
                    },
                    {
                      label: "Courses",
                      render: (institution: Institution) =>
                        institution.courses.slice(0, 4).join(", ") || "Not listed",
                    },
                    {
                      label: "Annual fees",
                      render: (institution: Institution) =>
                        institution.annualFees > 0
                          ? `₹${institution.annualFees.toLocaleString("en-IN")}`
                          : "Contact institute",
                    },
                    {
                      label: "Rating",
                      render: (institution: Institution) =>
                        institution.rating > 0
                          ? institution.rating.toFixed(1)
                          : "Not rated",
                    },
                    {
                      label: "Facilities",
                      render: (institution: Institution) =>
                        institution.facilities.slice(0, 4).join(", ") ||
                        "Not listed",
                    },
                    {
                      label: "Head / principal",
                      render: (institution: Institution) => institution.headName,
                    },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="border-b border-slate-200/80 px-4 py-4 font-semibold text-slate-700">
                        {row.label}
                      </td>
                      {selectedInstitutions.map((institution) => (
                        <td
                          key={`${row.label}-${institution._id}`}
                          className="border-b border-slate-200/80 px-4 py-4 text-slate-600"
                        >
                          {row.render(institution)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="grid gap-5">
            {loading ? (
              <div className="glass-panel rounded-[2rem] px-6 py-8 text-sm text-slate-600">
                Loading matching institutions...
              </div>
            ) : institutions.length === 0 ? (
              <div className="glass-panel rounded-[2rem] px-6 py-8 text-sm text-slate-600">
                No institutions matched these filters yet. Try widening your
                search or ask an institute to complete its profile.
              </div>
            ) : (
              institutions.map((institution) => {
                const isSelected = selectedIds.includes(institution._id);
                const firstGalleryItem = institution.gallery?.[0];

                return (
                  <article
                    key={institution._id}
                    className="glass-panel rounded-[2rem] p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-[rgba(32,85,72,0.1)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--forest)]">
                            {institution.institutionType}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                            {institution.city}, {institution.state}
                          </span>
                        </div>
                        <h3 className="heading-serif mt-4 text-3xl text-slate-900">
                          {institution.name}
                        </h3>
                        <p className="mt-3 text-base leading-8 text-slate-600">
                          {institution.description}
                        </p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 text-sm">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Annual Fees
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                              {institution.annualFees > 0
                                ? `₹${institution.annualFees.toLocaleString("en-IN")}`
                                : "Contact institute"}
                            </p>
                          </div>
                          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 text-sm">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Rating
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                              {institution.rating > 0
                                ? institution.rating.toFixed(1)
                                : "Not rated"}
                            </p>
                          </div>
                          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 text-sm">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Students
                            </p>
                            <p className="mt-2 font-semibold text-slate-800">
                              {institution.totalStudents.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-4 text-sm leading-7 text-slate-600">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Courses
                            </p>
                            <p className="mt-2">
                              {institution.courses.join(", ") || "Not listed"}
                            </p>
                          </div>
                          <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-4 text-sm leading-7 text-slate-600">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Facilities
                            </p>
                            <p className="mt-2">
                              {institution.facilities.join(", ") || "Not listed"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full lg:max-w-xs">
                        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-4">
                          <div className="rounded-[1.4rem] bg-[linear-gradient(135deg,rgba(32,85,72,0.14),rgba(122,199,217,0.18))] p-5">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                              Gallery preview
                            </p>
                            <div className="mt-3 rounded-[1.2rem] border border-white/70 bg-white/70 p-4 text-sm text-slate-600">
                              {firstGalleryItem ? (
                                <>
                                  <p className="font-semibold text-slate-800">
                                    {firstGalleryItem.kind === "video"
                                      ? "Video showcase"
                                      : "Image showcase"}
                                  </p>
                                  <p className="mt-2 break-all text-xs leading-6 text-slate-500">
                                    {firstGalleryItem.url}
                                  </p>
                                  {firstGalleryItem.caption ? (
                                    <p className="mt-2">{firstGalleryItem.caption}</p>
                                  ) : null}
                                </>
                              ) : (
                                <p>
                                  This institute has not added gallery items yet.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3">
                            <button
                              type="button"
                              onClick={() => toggleCompare(institution._id)}
                              className={`rounded-full px-4 py-3 text-sm font-semibold ${
                                isSelected
                                  ? "bg-[rgba(32,85,72,0.12)] text-[var(--forest)]"
                                  : "border border-slate-300 bg-white text-slate-700"
                              }`}
                            >
                              {isSelected ? "Remove from Compare" : "Add to Compare"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveInstitution(institution);
                                setNotice(null);
                                setError(null);
                              }}
                              className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
                            >
                              Send Inquiry
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <aside className="glass-panel rounded-[2rem] p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Inquiry Desk
            </p>
            <h2 className="heading-serif mt-3 text-3xl text-slate-900">
              {activeInstitution
                ? `Contact ${activeInstitution.name}`
                : "Pick an institution to reach out"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Write a focused message, mention the course you care about, and
              send your request straight to the institute team.
            </p>

            {activeInstitution ? (
              <form onSubmit={sendInquiry} className="mt-6 space-y-4">
                <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 text-sm">
                  <p className="font-semibold text-slate-800">
                    {activeInstitution.name}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {activeInstitution.city}, {activeInstitution.state}
                  </p>
                </div>

                <input
                  value={preferredCourse}
                  onChange={(event) => setPreferredCourse(event.target.value)}
                  placeholder="Preferred course or program"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
                <textarea
                  value={inquiryMessage}
                  onChange={(event) => setInquiryMessage(event.target.value)}
                  rows={6}
                  placeholder="Introduce yourself, ask about admissions, fees, facilities, or any specific detail you need."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={sendingInquiry}
                    className="flex-1 rounded-full bg-[var(--forest)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                  >
                    {sendingInquiry ? "Sending..." : "Send Inquiry"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInstitution(null)}
                    className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 rounded-[1.8rem] border border-dashed border-slate-300 bg-white/65 px-5 py-8 text-sm leading-7 text-slate-500">
                Use the “Send Inquiry” button on any institution card to open
                the contact panel here.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
