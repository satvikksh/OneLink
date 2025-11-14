import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  chatId: string; // deterministic room id
  from: string;   // userId
  to: string;     // userId
  text: string;
  createdAt: Date;
  read: boolean;
}

const MessageSchema = new Schema<IMessage>({
  chatId: { type: String, required: true, index: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
