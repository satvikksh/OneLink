import { Schema, model, models } from "mongoose";

const InquirySchema = new Schema(
  {
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentName: { type: String, required: true, trim: true },
    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    preferredCourse: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "replied", "closed"],
      default: "new",
    },
    responseMessage: { type: String, default: "", trim: true },
    respondedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const InquiryModel = (models.Inquiry as any) || model("Inquiry", InquirySchema);

export { InquiryModel as Inquiry };
export default InquiryModel;
