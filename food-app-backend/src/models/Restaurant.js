import { Schema, model } from "mongoose";

const MenuItemSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const RestaurantSchema = new Schema(
  {
    name: { type: String, required: true },
    country: { type: String, enum: ["India", "America"], required: true },
    menu: { type: [MenuItemSchema], default: [] },
  },
  { timestamps: true }
);

export default model("Restaurant", RestaurantSchema);
