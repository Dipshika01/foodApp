import mongoose from "mongoose";

const CancelledOrderSchema = new mongoose.Schema({
  orderNo:   { type: String, required: true, index: true, unique: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items:     { type: Array, default: [] },
  total:     { type: Number, default: 0 },
  paymentMethod:  { type: String },
  paymentStatus:  { type: String },
  txnId:          { type: String },
  paidAt:         { type: Date },
  statusAtCancel: { type: String },
  cancelledAt:    { type: Date, default: () => new Date() },
  cancelledBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cancelReason:   { type: String, default: "" },
}, { timestamps: true, collection: "cancelledorders" });

export default mongoose.model("CancelledOrder", CancelledOrderSchema);
