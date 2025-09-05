// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";
// import User from "../src/models/User.js";
// import Restaurant from "../src/models/Restaurant.js";
// import PaymentMethod from "../src/models/PaymentMethod.js";

// dotenv.config();
// const mongo = process.env.MONGO_URI;
// console.log("Mongo URL: ", mongo);
// async function main() {
//   await mongoose.connect(mongo);

//   await Promise.all([
//     User.deleteMany({}),
//     Restaurant.deleteMany({}),
//     PaymentMethod.deleteMany({}),
//   ]);

//   const salt = await bcrypt.genSalt(10);
//   const hash = (p) => bcrypt.hash(p, salt);

//   const [nick, carol, steve, thanos, thor, travis] = await User.insertMany([
//     { 
//         name: "Nick Fury", 
//         email: "nickfury@slooze.xyz",   
//         passwordHash: await hash("Admin@2025!"),   
//         role: "ADMIN",   
//         country: "America" 
//     },
//     { 
//         name: "Captain Marvel", 
//         email: "captainmarvel@slooze.xyz",  
//         passwordHash: await hash("Marvel@2025!"), 
//         role: "MANAGER", 
//         country: "India"   
//     },
//     { 
//         name: "Captain America", 
//         email: "captainamerica@slooze.xyz",  
//         passwordHash: await hash("America@2025!"), 
//         role: "MANAGER", 
//         country: "America" 
//     },
//     { 
//         name: "Thanos", 
//         email: "thanos@slooze.xyz",   
//         passwordHash: await hash("Thanos@2025!"),  
//         role: "MEMBER",  
//         country: "India"   
//     },
//     { 
//         name: "Thor", 
//         email: "thor@slooze.xyz",     
//         passwordHash: await hash("Thor@2025!"),  
//         role: "MEMBER",  
//         country: "India"   
//     },
//     { 
//         name: "Travis", 
//         email: "travis@slooze.xyz",   
//         passwordHash: await hash("Travis@2025!"),  
//         role: "MEMBER",  
//         country: "America" 
//     },
//     ]);


//   await Restaurant.insertMany([
//     {
//       name: "Curry House",
//       country: "India",
//       menu: [
//         { name: "Paneer Tikka", price: 8.5 },
//         { name: "Butter Naan",  price: 2.5 },
//         { name: "Masala Chai",  price: 1.2 },
//       ],
//     },
//     {
//       name: "Burger Bros",
//       country: "America",
//       menu: [
//         { name: "Smash Burger", price: 9.9 },
//         { name: "Fries",        price: 3.5 },
//         { name: "Milkshake",    price: 4.2 },
//       ],
//     },
//   ]);

//   // admin-only resources: one default payment method per country
//   await PaymentMethod.insertMany([
//     { nickname: "IN-Primary", type: "CARD", country: "India",   isDefault: true,  createdBy: nick._id },
//     { nickname: "US-Primary", type: "CARD", country: "America", isDefault: true,  createdBy: nick._id },
//   ]);

//   console.log("Seeded users, restaurants, payment methods");
//   await mongoose.disconnect();
// }

// main().catch((e) => { console.error(e); process.exit(1); });

// seedRestaurants.js
// Run with: node seedRestaurants.js
// Requires: "type": "module" in package.json (or convert imports to require)

import mongoose from "mongoose";
import dotenv from "dotenv";
import Restaurant from "../src/models/Restaurant.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME   = process.env.DB_NAME   || "foodapp";

// helper for menu item
const m = (id, name, description, price, image) => ({ id, name, description, price, image });

// generic Unsplash-style images (feel free to swap with your own CDN links)
const img = {
  // covers
  haldirams:  "https://images.unsplash.com/photo-1631452180519-5ef76e76510b?q=80&w=1200&auto=format&fit=crop",
  saravana:   "https://images.unsplash.com/photo-1615485737651-9a39b4e8ca04?q=80&w=1200&auto=format&fit=crop",
  bbqNation:  "https://images.unsplash.com/photo-1550547660-8b1a0f8c9f4d?q=80&w=1200&auto=format&fit=crop",
  paradise:   "https://images.unsplash.com/photo-1601050690113-c7b2f58d90d4?q=80&w=1200&auto=format&fit=crop",
  shakeshack: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop",
  chipotle:   "https://images.unsplash.com/photo-1601050690468-1e5f8a5d3d1f?q=80&w=1200&auto=format&fit=crop",
  olive:      "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop",
  ihop:       "https://images.unsplash.com/photo-1516747773449-7db8441f0c01?q=80&w=1200&auto=format&fit=crop",
  panda:      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",

  // menu items
  kachori:    "https://images.unsplash.com/photo-1626082927389-0f1e5665f795?q=80&w=1200&auto=format&fit=crop",
  chole:      "https://images.unsplash.com/photo-1628294896516-52b55f99b2fc?q=80&w=1200&auto=format&fit=crop",
  rasmalai:   "https://images.unsplash.com/photo-1635179941011-3a1e3a57316c?q=80&w=1200&auto=format&fit=crop",

  dosa:       "https://images.unsplash.com/photo-1615485737651-9a39b4e8ca04?q=80&w=1200&auto=format&fit=crop",
  idli:       "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?q=80&w=1200&auto=format&fit=crop",
  filter:     "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop",

  paneer:     "https://images.unsplash.com/photo-1625944527944-1a5d2b9f8a98?q=80&w=1200&auto=format&fit=crop",
  wings:      "https://images.unsplash.com/photo-1541542684-4a9c2d5b2b3b?q=80&w=1200&auto=format&fit=crop",
  jamun:      "https://images.unsplash.com/photo-1625944531036-35f0c7aa90bf?q=80&w=1200&auto=format&fit=crop",

  biryani:    "https://images.unsplash.com/photo-1601050690113-c7b2f58d90d4?q=80&w=1200&auto=format&fit=crop",
  vegbiryani: "https://images.unsplash.com/photo-1625944528500-8b9b9b0f1160?q=80&w=1200&auto=format&fit=crop",
  doublek:    "https://images.unsplash.com/photo-1601315481102-8e8620167c75?q=80&w=1200&auto=format&fit=crop",

  shackburger:"https://images.unsplash.com/photo-1550547660-8b1a0f8c9f4d?q=80&w=1200&auto=format&fit=crop",
  crinkle:    "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=1200&auto=format&fit=crop",
  shake:      "https://images.unsplash.com/photo-1460891053196-b9d4d6363a2a?q=80&w=1200&auto=format&fit=crop",

  burrito:    "https://images.unsplash.com/photo-1601924582971-b0c5be3d1c97?q=80&w=1200&auto=format&fit=crop",
  bowl:       "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
  chips:      "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1200&auto=format&fit=crop",

  alfredo:    "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop",
  soup:       "https://images.unsplash.com/photo-1505575972945-2804b4bdc5d9?q=80&w=1200&auto=format&fit=crop",
  tiramisu:   "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",

  pancakes:   "https://images.unsplash.com/photo-1587731556938-38755b4803be?q=80&w=1200&auto=format&fit=crop",
  toast:      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=1200&auto=format&fit=crop",
  waffles:    "https://images.unsplash.com/photo-1566478989037-5c1f52f3a9f5?q=80&w=1200&auto=format&fit=crop",

  orange:     "https://images.unsplash.com/photo-1598866594230-a1d1b2e2e1a9?q=80&w=1200&auto=format&fit=crop",
  chowmein:   "https://images.unsplash.com/photo-1556767576-5ec41e3239f7?q=80&w=1200&auto=format&fit=crop",
  rolls:      "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1200&auto=format&fit=crop",
};

const data = [
  // INDIA
  {
    name: "Haldiram's",
    cuisine: "Indian",
    city: "Delhi",
    country: "India",
    coverImage: img.haldirams,
    categories: ["North Indian", "Vegetarian", "Popular"],
    menu: [
      m("haldirams-raj-kachori", "Raj Kachori", "Crisp stuffed kachori with chutneys.", 120, img.kachori),
      m("haldirams-chole-bhature", "Chole Bhature", "Spiced chickpeas with fried bread.", 180, img.chole),
      m("haldirams-rasmalai", "Rasmalai", "Cottage cheese patties in sweet milk.", 140, img.rasmalai),
    ],
  },
  {
    name: "Saravana Bhavan",
    cuisine: "Indian",
    city: "Chennai",
    country: "India",
    coverImage: img.saravana,
    categories: ["South Indian", "Vegetarian", "Homestyle"],
    menu: [
      m("saravana-masala-dosa", "Masala Dosa", "Crisp dosa with spiced potato.", 120, img.dosa),
      m("saravana-idli-sambar", "Idli Sambar", "Steamed rice cakes with sambar.", 90, img.idli),
      m("saravana-filter-coffee", "Filter Coffee", "Classic South Indian brew.", 60, img.filter),
    ],
  },
  {
    name: "Barbeque Nation",
    cuisine: "Indian",
    city: "Hyderabad",
    country: "India",
    coverImage: img.bbqNation,
    categories: ["BBQ", "Casual", "Family"],
    menu: [
      m("bbqn-paneer-tikka", "Grilled Paneer Tikka", "Tandoor-grilled cottage cheese.", 260, img.paneer),
      m("bbqn-chicken-wings", "Chicken Wings", "Smoky, tangy glaze.", 320, img.wings),
      m("bbqn-gulab-jamun", "Gulab Jamun", "Warm sugar syrup dumplings.", 120, img.jamun),
    ],
  },
  {
    name: "Paradise Biryani",
    cuisine: "Indian",
    city: "Hyderabad",
    country: "India",
    coverImage: img.paradise,
    categories: ["Biryani", "Curry House", "Popular"],
    menu: [
      m("paradise-chicken-biryani", "Hyderabadi Chicken Biryani", "Fragrant basmati & spiced chicken.", 320, img.biryani),
      m("paradise-veg-biryani", "Veg Biryani", "Seasonal veg & saffron rice.", 260, img.vegbiryani),
      m("paradise-double-ka-meetha", "Double Ka Meetha", "Bread pudding with nuts.", 160, img.doublek),
    ],
  },

  // AMERICA
  {
    name: "Shake Shack",
    cuisine: "American",
    city: "New York",
    country: "America",
    coverImage: img.shakeshack,
    categories: ["Burgers", "Fast Food", "Comfort"],
    menu: [
      m("shack-shackburger", "ShackBurger", "Cheeseburger with ShackSauce.", 9, img.shackburger),
      m("shack-fries", "Crinkle-Cut Fries", "Crispy crinkles.", 4, img.crinkle),
      m("shack-shake", "Hand-Spun Shake", "Rich and creamy.", 6, img.shake),
    ],
  },
  {
    name: "Chipotle Mexican Grill",
    cuisine: "Mexican",
    city: "Austin",
    country: "America",
    coverImage: img.chipotle,
    categories: ["Mexican", "Fast Food", "Takeaway", "Quick Bites"],
    menu: [
      m("chipotle-chicken-burrito", "Chicken Burrito", "Flour tortilla with fillings.", 9, img.burrito),
      m("chipotle-veggie-bowl", "Veggie Bowl", "Rice, beans, guac, salsa.", 10, img.bowl),
      m("chipotle-chips-guac", "Chips & Guac", "Corn chips with guacamole.", 5, img.chips),
    ],
  },
  {
    name: "Olive Garden",
    cuisine: "Italian",
    city: "Orlando",
    country: "America",
    coverImage: img.olive,
    categories: ["Italian", "European", "Family", "Desserts"],
    menu: [
      m("olive-alfredo", "Fettuccine Alfredo", "Cream sauce with parmesan.", 14, img.alfredo),
      m("olive-minestrone", "Minestrone Soup", "Hearty veg soup.", 7, img.soup),
      m("olive-tiramisu", "Tiramisu", "Coffee-soaked dessert.", 8, img.tiramisu),
    ],
  },
  {
    name: "IHOP",
    cuisine: "American",
    city: "Chicago",
    country: "America",
    coverImage: img.ihop,
    categories: ["Breakfast", "Brunch", "Desserts"],
    menu: [
      m("ihop-pancakes", "Buttermilk Pancakes", "Stack of fluffy pancakes.", 8, img.pancakes),
      m("ihop-french-toast", "French Toast", "Griddled brioche, syrup.", 9, img.toast),
      m("ihop-chicken-waffles", "Chicken & Waffles", "Crispy + fluffy combo.", 12, img.waffles),
    ],
  },
  {
    name: "Panda Express",
    cuisine: "Chinese",
    city: "San Francisco",
    country: "America",
    coverImage: img.panda,
    categories: ["Chinese", "Asian", "Quick Bites"],
    menu: [
      m("panda-orange-chicken", "Orange Chicken", "Signature sweet & tangy.", 9, img.orange),
      m("panda-chow-mein", "Chow Mein", "Stir-fried noodles.", 7, img.chowmein),
      m("panda-spring-rolls", "Veg Spring Rolls", "Crispy appetizers.", 5, img.rolls),
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  console.log(`Connected → ${MONGO_URI}/${DB_NAME}`);

  await Restaurant.deleteMany({});
  const inserted = await Restaurant.insertMany(data);

  // quick category coverage log
  const catSet = new Set();
  inserted.forEach(r => (r.categories || []).forEach(c => catSet.add(c)));
  console.log(`Seeded ${inserted.length} restaurants. Categories covered (${catSet.size}):`, [...catSet].join(", "));

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
