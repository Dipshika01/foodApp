import { Schema, model, Types } from "mongoose";

const OrderItemSchema = new Schema(
  {
    menuItemId: { type: Types.ObjectId },
    name: String,
    price: Number,
    qty: Number,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    country: { type: String, enum: ["India", "America"], required: true },
    restaurantId: { type: Types.ObjectId, ref: "Restaurant", required: true },
    items: { type: [OrderItemSchema], default: [] },
    status: { type: String, enum: ["DRAFT", "PLACED", "CANCELLED"], default: "DRAFT" },
    total: { type: Number, default: 0 },
    paymentMethodId: { type: Types.ObjectId, ref: "PaymentMethod" },
  },
  { timestamps: true }
);

export default model("Order", OrderSchema);
