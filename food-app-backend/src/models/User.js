import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "MANAGER", "MEMBER"], required: true },
    country: { type: String, enum: ["India", "America"], required: true },
  },
  { timestamps: true }
);

export default model("User", UserSchema);