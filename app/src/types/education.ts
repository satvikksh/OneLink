export type AccountRole = "student" | "institute";

export type AppUser = {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: AccountRole | "recruiter" | "creator";
  organizationName?: string | null;
};

export type GalleryItem = {
  kind: "image" | "video";
  url: string;
  caption: string;
};

export type Institution = {
  _id: string;
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
  establishedYear: number;
  headName: string;
  totalStudents: number;
  annualFees: number;
  rating: number;
  accreditation: string;
  courses: string[];
  facilities: string[];
  description: string;
  infrastructure: string;
  faculty: string;
  gallery: GalleryItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type Inquiry = {
  _id: string;
  institutionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  preferredCourse: string;
  message: string;
  status: "new" | "replied" | "closed";
  responseMessage: string;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
