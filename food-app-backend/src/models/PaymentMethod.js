import { Schema, model, Types } from "mongoose";

const PaymentMethodSchema = new Schema(
  {
    nickname: { type: String, required: true },
    type: { type: String, enum: ["CARD", "UPI", "BANK"], default: "CARD" },
    country: { type: String, enum: ["India", "America"], required: true },
    isDefault: { type: Boolean, default: false },
    details: { type: Schema.Types.Mixed, default: {} }, // keep it simple
    createdBy: { type: Types.ObjectId, ref: "User" },   // admin user id
  },
  { timestamps: true }
);

export default model("PaymentMethod", PaymentMethodSchema);
