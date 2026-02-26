import { Schema, model, models } from "mongoose";

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
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    establishedYear: { type: Number, required: true },
    headName: { type: String, required: true, trim: true },
    totalStudents: { type: Number, required: true },
    accreditation: { type: String, default: "", trim: true },
    courses: { type: [String], default: [] },
    facilities: { type: [String], default: [] },
    description: { type: String, required: true, trim: true },
    createdBy: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

const InstitutionModel =
  (models.Institution as any) || model("Institution", InstitutionSchema);

export { InstitutionModel as Institution };
export default InstitutionModel;