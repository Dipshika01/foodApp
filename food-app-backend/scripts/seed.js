import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import Restaurant from "../src/models/Restaurant.js";
import PaymentMethod from "../src/models/PaymentMethod.js";

dotenv.config();
const mongo = process.env.MONGO_URI;
console.log("Mongo URL: ", mongo);
async function main() {
  await mongoose.connect(mongo);

  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    PaymentMethod.deleteMany({}),
  ]);

  const salt = await bcrypt.genSalt(10);
  const hash = (p) => bcrypt.hash(p, salt);

  const [nick, carol, steve, thanos, thor, travis] = await User.insertMany([
    { 
        name: "Nick Fury", 
        email: "nickfury@slooze.xyz",   
        passwordHash: await hash("Admin@2025!"),   
        role: "ADMIN",   
        country: "America" 
    },
    { 
        name: "Captain Marvel", 
        email: "captainmarvel@slooze.xyz",  
        passwordHash: await hash("Marvel@2025!"), 
        role: "MANAGER", 
        country: "India"   
    },
    { 
        name: "Captain America", 
        email: "captainamerica@slooze.xyz",  
        passwordHash: await hash("America@2025!"), 
        role: "MANAGER", 
        country: "America" 
    },
    { 
        name: "Thanos", 
        email: "thanos@slooze.xyz",   
        passwordHash: await hash("Thanos@2025!"),  
        role: "MEMBER",  
        country: "India"   
    },
    { 
        name: "Thor", 
        email: "thor@slooze.xyz",     
        passwordHash: await hash("Thor@2025!"),  
        role: "MEMBER",  
        country: "India"   
    },
    { 
        name: "Travis", 
        email: "travis@slooze.xyz",   
        passwordHash: await hash("Travis@2025!"),  
        role: "MEMBER",  
        country: "America" 
    },
    ]);


  await Restaurant.insertMany([
    {
      name: "Curry House",
      country: "India",
      menu: [
        { name: "Paneer Tikka", price: 8.5 },
        { name: "Butter Naan",  price: 2.5 },
        { name: "Masala Chai",  price: 1.2 },
      ],
    },
    {
      name: "Burger Bros",
      country: "America",
      menu: [
        { name: "Smash Burger", price: 9.9 },
        { name: "Fries",        price: 3.5 },
        { name: "Milkshake",    price: 4.2 },
      ],
    },
  ]);

  // admin-only resources: one default payment method per country
  await PaymentMethod.insertMany([
    { nickname: "IN-Primary", type: "CARD", country: "India",   isDefault: true,  createdBy: nick._id },
    { nickname: "US-Primary", type: "CARD", country: "America", isDefault: true,  createdBy: nick._id },
  ]);

  console.log("Seeded users, restaurants, payment methods");
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
