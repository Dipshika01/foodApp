import mongoose from "mongoose";



const PaymentInfoSchema = new mongoose.Schema(
  {
    methodId: String,
    txnId:    String,
    amount:   Number,
    when:     Date,
  },
  { _id: false }
);

const OrderItemSchema = new mongoose.Schema(
  {
    restaurantId: { type: String, required: true },
    restaurantName: String, // optional on each item
    itemId: { type: String, required: true },
    name: String,
    price: { type: Number, required: true },
    qty: { type: Number, default: 1 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurantId: { type: String, required: true, index: true },
    restaurantName: { type: String, default: "" },

    country: { type: String, enum: ["India", "America"], required: true, index: true },

    items: { type: [OrderItemSchema], default: [] },
    total: { type: Number, default: 0 },
    status: { type: String, enum: ["Placed", "Cancelled", "Fulfilled"], default: "Placed" },

    paymentMethod: { type: String, enum: ["COD", "CARD", "UPI"], required: true },
    paymentStatus: { type: String, enum: ["paid", "cod", "failed"], required: true },
    txnId: { type: String, default: "" },
    paidAt: { type: Date },
  },
  { timestamps: true }
);
// helpful indexes for common queries
// OrderSchema.index({ userId: 1, createdAt: -1 });
// OrderSchema.index({ country: 1, createdAt: -1 });

export default mongoose.model("Order", OrderSchema);