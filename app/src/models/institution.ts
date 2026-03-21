import { Schema, model, models } from "mongoose";

const GalleryItemSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ["image", "video"],
      required: true,
      default: "image",
    },
    url: { type: String, required: true, trim: true },
    caption: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const InstitutionSchema = new Schema(
  {
    institutionType: {
      type: String,
      enum: ["college", "school"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    website: { type: String, default: "", trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true, index: true },
    country: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    establishedYear: { type: Number, required: true },
    headName: { type: String, required: true, trim: true },
    totalStudents: { type: Number, required: true, min: 0 },
    annualFees: { type: Number, default: 0, min: 0, index: true },
    rating: { type: Number, default: 0, min: 0, max: 5, index: true },
    accreditation: { type: String, default: "", trim: true },
    courses: { type: [String], default: [] },
    facilities: { type: [String], default: [] },
    description: { type: String, required: true, trim: true },
    infrastructure: { type: String, default: "", trim: true },
    faculty: { type: String, default: "", trim: true },
    gallery: { type: [GalleryItemSchema], default: [] },
    createdBy: { type: String, default: null, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const InstitutionModel = (models.Institution as any) || model("Institution", InstitutionSchema);

export { InstitutionModel as Institution };
export default InstitutionModel;
