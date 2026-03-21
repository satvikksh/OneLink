"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type {
  AppUser,
  GalleryItem,
  Inquiry,
  Institution,
} from "../../src/types/education";

type InstitutionForm = {
  institutionType: "college" | "school";
  name: string;
  email: string;
  phone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  establishedYear: string;
  headName: string;
  totalStudents: string;
  annualFees: string;
  rating: string;
  accreditation: string;
  courses: string;
  facilities: string;
  description: string;
  infrastructure: string;
  faculty: string;
  gallery: GalleryItem[];
};

type InquiryDraft = {
  status: "new" | "replied" | "closed";
  responseMessage: string;
};

const emptyForm: InstitutionForm = {
  institutionType: "college",
  name: "",
  email: "",
  phone: "",
  website: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
  establishedYear: "",
  headName: "",
  totalStudents: "",
  annualFees: "",
  rating: "",
  accreditation: "",
  courses: "",
  facilities: "",
  description: "",
  infrastructure: "",
  faculty: "",
  gallery: [],
};

function institutionToForm(institution: Institution | null): InstitutionForm {
  if (!institution) return emptyForm;

  return {
    institutionType: institution.institutionType,
    name: institution.name || "",
    email: institution.email || "",
    phone: institution.phone || "",
    website: institution.website || "",
    addressLine1: institution.addressLine1 || "",
    addressLine2: institution.addressLine2 || "",
    city: institution.city || "",
    state: institution.state || "",
    country: institution.country || "",
    zipCode: institution.zipCode || "",
    establishedYear: institution.establishedYear ? String(institution.establishedYear) : "",
    headName: institution.headName || "",
    totalStudents: institution.totalStudents ? String(institution.totalStudents) : "",
    annualFees: institution.annualFees ? String(institution.annualFees) : "",
    rating: institution.rating ? String(institution.rating) : "",
    accreditation: institution.accreditation || "",
    courses: institution.courses?.join(", ") || "",
    facilities: institution.facilities?.join(", ") || "",
    description: institution.description || "",
    infrastructure: institution.infrastructure || "",
    faculty: institution.faculty || "",
    gallery: institution.gallery || [],
  };
}

export default function InstituteDashboard() {
  const router = useRouter();
  const [isRouting, startTransition] = useTransition();
  const [viewer, setViewer] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<InstitutionForm>(emptyForm);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, InquiryDraft>>({});
  const [activeInquiryId, setActiveInquiryId] = useState<string | null>(null);

  useEffect(() => {
    async function hydrateDashboard() {
      try {
        const [userResponse, institutionResponse, inquiriesResponse] =
          await Promise.all([
            fetch("/api/auth/me", {
              cache: "no-store",
              credentials: "include",
            }),
            fetch("/api/institutions?mine=1", {
              cache: "no-store",
              credentials: "include",
            }),
            fetch("/api/inquiries", {
              cache: "no-store",
              credentials: "include",
            }),
          ]);

        if (!userResponse.ok) {
          router.replace("/institutes/login?next=/institutes/dashboard");
          return;
        }

        const userData = await userResponse.json();
        if (userData?.user?.role === "student") {
          router.replace("/students/discover");
          return;
        }

        const institutionData = await institutionResponse.json().catch(() => ({}));
        const inquiryData = await inquiriesResponse.json().catch(() => ({}));

        setViewer(userData.user);
        setForm(institutionToForm(institutionData?.institution || null));
        setInquiries(inquiryData?.inquiries || []);
        setDrafts(
          Object.fromEntries(
            (inquiryData?.inquiries || []).map((inquiry: Inquiry) => [
              inquiry._id,
              {
                status: inquiry.status,
                responseMessage: inquiry.responseMessage || "",
              },
            ])
          )
        );
        setReady(true);
      } catch {
        router.replace("/institutes/login?next=/institutes/dashboard");
      } finally {
        setLoading(false);
      }
    }

    hydrateDashboard();
  }, [router]);

  const inquirySummary = useMemo(
    () => ({
      total: inquiries.length,
      newCount: inquiries.filter((item) => item.status === "new").length,
      repliedCount: inquiries.filter((item) => item.status === "replied").length,
    }),
    [inquiries]
  );

  const updateField = (key: keyof InstitutionForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateGalleryItem = (
    index: number,
    key: keyof GalleryItem,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      gallery: current.gallery.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addGalleryItem = (kind: GalleryItem["kind"]) => {
    setForm((current) => ({
      ...current,
      gallery: [...current.gallery, { kind, url: "", caption: "" }],
    }));
  };

  const removeGalleryItem = (index: number) => {
    setForm((current) => ({
      ...current,
      gallery: current.gallery.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setStatusMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          annualFees: Number(form.annualFees || 0),
          rating: Number(form.rating || 0),
          establishedYear: Number(form.establishedYear),
          totalStudents: Number(form.totalStudents),
          courses: form.courses,
          facilities: form.facilities,
          gallery: form.gallery.filter((item) => item.url.trim()),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || "Unable to save your institution profile.");
        return;
      }

      setForm(institutionToForm(data?.institution || null));
      setStatusMessage("Institution profile updated successfully.");
    } catch {
      setError("Network error while saving the profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveInquiryReply(inquiryId: string) {
    const draft = drafts[inquiryId];
    if (!draft) return;

    setActiveInquiryId(inquiryId);
    setStatusMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          inquiryId,
          status: draft.status,
          responseMessage: draft.responseMessage,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || "Unable to update inquiry.");
        return;
      }

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry._id === inquiryId ? (data.inquiry as Inquiry) : inquiry
        )
      );
      setStatusMessage("Inquiry response updated.");
    } catch {
      setError("Network error while updating the inquiry.");
    } finally {
      setActiveInquiryId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    startTransition(() => {
      router.replace("/institutes/login");
    });
  }

  if (!ready && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel rounded-[2rem] px-8 py-6 text-sm text-slate-600">
          Loading your institute dashboard...
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
                Institute Dashboard
              </p>
              <h1 className="heading-serif mt-3 text-4xl text-slate-900 sm:text-5xl">
                Manage your institution profile, gallery, and incoming interest
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {viewer?.organizationName || viewer?.name
                  ? `${viewer.organizationName || viewer.name} can keep the public listing accurate from this workspace.`
                  : "Keep your public listing accurate from this workspace."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/"
                className="rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-slate-700"
              >
                Home
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isRouting}
                className="rounded-full bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-70"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { label: "Total inquiries", value: inquirySummary.total.toString() },
              { label: "New inquiries", value: inquirySummary.newCount.toString() },
              {
                label: "Replied inquiries",
                value: inquirySummary.repliedCount.toString(),
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

        {statusMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <form onSubmit={saveProfile} className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Institution Profile
                </p>
                <h2 className="heading-serif mt-2 text-3xl text-slate-900">
                  Publish complete academic and campus details
                </h2>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Institution Type</span>
                <select
                  value={form.institutionType}
                  onChange={(event) =>
                    updateField(
                      "institutionType",
                      event.target.value as InstitutionForm["institutionType"]
                    )
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                >
                  <option value="college">College</option>
                  <option value="school">School</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Institution Name</span>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Public Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Website</span>
                <input
                  value={form.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Annual Fees</span>
                <input
                  type="number"
                  value={form.annualFees}
                  onChange={(event) => updateField("annualFees", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Rating (0 to 5)</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(event) => updateField("rating", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Accreditation</span>
                <input
                  value={form.accreditation}
                  onChange={(event) =>
                    updateField("accreditation", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span>Address Line 1</span>
                <input
                  value={form.addressLine1}
                  onChange={(event) =>
                    updateField("addressLine1", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span>Address Line 2</span>
                <input
                  value={form.addressLine2}
                  onChange={(event) =>
                    updateField("addressLine2", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>City</span>
                <input
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>State</span>
                <input
                  value={form.state}
                  onChange={(event) => updateField("state", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Country</span>
                <input
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Zip Code</span>
                <input
                  value={form.zipCode}
                  onChange={(event) => updateField("zipCode", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Established Year</span>
                <input
                  type="number"
                  value={form.establishedYear}
                  onChange={(event) =>
                    updateField("establishedYear", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Head / Principal / Dean</span>
                <input
                  value={form.headName}
                  onChange={(event) => updateField("headName", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Total Students</span>
                <input
                  type="number"
                  value={form.totalStudents}
                  onChange={(event) =>
                    updateField("totalStudents", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span>Courses Offered</span>
                <input
                  value={form.courses}
                  onChange={(event) => updateField("courses", event.target.value)}
                  placeholder="Computer Science, Business, Architecture"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span>Facilities</span>
                <input
                  value={form.facilities}
                  onChange={(event) =>
                    updateField("facilities", event.target.value)
                  }
                  placeholder="Library, Labs, Hostel, Sports Complex"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span>Description</span>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span>Infrastructure</span>
                <textarea
                  rows={4}
                  value={form.infrastructure}
                  onChange={(event) =>
                    updateField("infrastructure", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span>Faculty</span>
                <textarea
                  rows={4}
                  value={form.faculty}
                  onChange={(event) => updateField("faculty", event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                />
              </label>
            </div>

            <div className="mt-8 rounded-[2rem] border border-slate-200/80 bg-white/70 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Gallery Manager
                  </p>
                  <h3 className="heading-serif mt-2 text-2xl text-slate-900">
                    Add image and video showcases
                  </h3>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => addGalleryItem("image")}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
                  >
                    Add Image
                  </button>
                  <button
                    type="button"
                    onClick={() => addGalleryItem("video")}
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Add Video
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {form.gallery.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white/65 px-4 py-6 text-sm text-slate-500">
                    No gallery items added yet.
                  </div>
                ) : (
                  form.gallery.map((item, index) => (
                    <div
                      key={`${item.kind}-${index}`}
                      className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-[0.18fr_1fr_1fr_auto]"
                    >
                      <select
                        value={item.kind}
                        onChange={(event) =>
                          updateGalleryItem(
                            index,
                            "kind",
                            event.target.value as GalleryItem["kind"]
                          )
                        }
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                      <input
                        value={item.url}
                        onChange={(event) =>
                          updateGalleryItem(index, "url", event.target.value)
                        }
                        placeholder="https://example.com/media"
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                      />
                      <input
                        value={item.caption}
                        onChange={(event) =>
                          updateGalleryItem(index, "caption", event.target.value)
                        }
                        placeholder="Caption"
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(index)}
                        className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </form>

          <section className="glass-panel rounded-[2rem] p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                Inquiry Inbox
              </p>
              <h2 className="heading-serif mt-2 text-3xl text-slate-900">
                Review and reply to student requests
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Incoming questions appear here with their current status so your
                team can respond and keep the conversation moving.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {inquiries.length === 0 ? (
                <div className="rounded-[1.8rem] border border-dashed border-slate-300 bg-white/65 px-5 py-8 text-sm text-slate-500">
                  No student inquiries yet. Once students reach out from the
                  discovery view, their messages will appear here.
                </div>
              ) : (
                inquiries.map((inquiry) => {
                  const draft = drafts[inquiry._id] || {
                    status: inquiry.status,
                    responseMessage: inquiry.responseMessage || "",
                  };

                  return (
                    <article
                      key={inquiry._id}
                      className="rounded-[1.8rem] border border-slate-200/80 bg-white/80 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {inquiry.studentName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {inquiry.studentEmail}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                            {new Date(inquiry.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="rounded-full bg-[rgba(223,109,60,0.12)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--accent-deep)]">
                          {inquiry.status}
                        </span>
                      </div>

                      {inquiry.preferredCourse ? (
                        <p className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          Preferred course: {inquiry.preferredCourse}
                        </p>
                      ) : null}

                      <p className="mt-4 rounded-3xl border border-slate-200/80 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                        {inquiry.message}
                      </p>

                      <div className="mt-4 space-y-3">
                        <select
                          value={draft.status}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [inquiry._id]: {
                                status: event.target.value as InquiryDraft["status"],
                                responseMessage: draft.responseMessage,
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                        >
                          <option value="new">New</option>
                          <option value="replied">Replied</option>
                          <option value="closed">Closed</option>
                        </select>
                        <textarea
                          rows={4}
                          value={draft.responseMessage}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [inquiry._id]: {
                                status: draft.status,
                                responseMessage: event.target.value,
                              },
                            }))
                          }
                          placeholder="Write your response here"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => saveInquiryReply(inquiry._id)}
                          disabled={activeInquiryId === inquiry._id}
                          className="w-full rounded-full bg-[var(--forest)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                        >
                          {activeInquiryId === inquiry._id
                            ? "Saving response..."
                            : "Save Reply"}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
