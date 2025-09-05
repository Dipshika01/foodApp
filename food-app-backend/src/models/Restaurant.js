import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String,
  price: Number,
  image: String, 
}, { _id: false });

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cuisine: String,
  city: String,
  country: { type: String, enum: ["India", "America"], default: "India" },
  coverImage: String,
  menu: [MenuItemSchema],
  categories: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.model("Restaurant", RestaurantSchema);