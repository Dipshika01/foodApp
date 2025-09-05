// seedRestaurants.js
// Run with: node seedRestaurants.js
// Requires: "type": "module" in package.json (or convert imports to require)

import mongoose from "mongoose";
import dotenv from "dotenv";
import Restaurant from "../src/models/Restaurant.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME   = process.env.DB_NAME || "foodapp";

// quick helper to make menu items
const m = (id, name, description, price, image) => ({
  id, name, description, price, image,
});

// Unsplash-like images (free to replace with your own)
const img = {
  // covers
  peppercorn: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
  sourdough:  "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1200&auto=format&fit=crop",
  copperpot:  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200&auto=format&fit=crop",
  bayburgers: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop",
  oliveore:   "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop",
  nomadnood:  "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1200&auto=format&fit=crop",
  hearthsmk:  "https://images.unsplash.com/photo-1550547660-8b1a0f8c9f4d?q=80&w=1200&auto=format&fit=crop",
  tiffinter:  "https://images.unsplash.com/photo-1604908554027-580d3aeee6f1?q=80&w=1200&auto=format&fit=crop",
  pinepista:  "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=1200&auto=format&fit=crop",

  // menu
  paneer:     "https://images.unsplash.com/photo-1625944527944-1a5d2b9f8a98?q=80&w=1200&auto=format&fit=crop",
  naan:       "https://images.unsplash.com/photo-1604908554000-1a16f3c0d4c2?q=80&w=1200&auto=format&fit=crop",
  chai:       "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1200&auto=format&fit=crop",
  burger:     "https://images.unsplash.com/photo-1550547660-8b1a0f8c9f4d?q=80&w=1200&auto=format&fit=crop",
  fries:      "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=1200&auto=format&fit=crop",
  shake:      "https://images.unsplash.com/photo-1460891053196-b9d4d6363a2a?q=80&w=1200&auto=format&fit=crop",
  carbonara:  "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop",
  garlic:     "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1200&auto=format&fit=crop",
  tiramisu:   "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
  ramen:      "https://images.unsplash.com/photo-1589308078056-f04d17c1b5f9?q=80&w=1200&auto=format&fit=crop",
  gyoza:      "https://images.unsplash.com/photo-1617191518305-6fb3c2a5f6ad?q=80&w=1200&auto=format&fit=crop",
  mochi:      "https://images.unsplash.com/photo-1570197788417-0e82375c9371?q=80&w=1200&auto=format&fit=crop",
  bbq:        "https://images.unsplash.com/photo-1550547660-8b1a0f8c9f4d?q=80&w=1200&auto=format&fit=crop",
  corn:       "https://images.unsplash.com/photo-1604908554027-580d3aeee6f1?q=80&w=1200&auto=format&fit=crop",
  slaw:       "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop",
  thali:      "https://images.unsplash.com/photo-1631452180519-5ef76e76510b?q=80&w=1200&auto=format&fit=crop",
  dosa:       "https://images.unsplash.com/photo-1615485737651-9a39b4e8ca04?q=80&w=1200&auto=format&fit=crop",
  lassi:      "https://images.unsplash.com/photo-1594142015004-5f6f0eab1f02?q=80&w=1200&auto=format&fit=crop",
  croissant:  "https://images.unsplash.com/photo-1511389026070-a14ae610a1be?q=80&w=1200&auto=format&fit=crop",
  latte:      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop",
  tart:       "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop",
};

const data = [
  {
    name: "Peppercorn Pavilion",
    cuisine: "Indian",
    city: "Bangalore",
    country: "India",
    coverImage: img.peppercorn,
    categories: ["North Indian", "Vegetarian", "Popular"],
    menu: [
      m("paneer-tikka", "Paneer Tikka", "Charred paneer, peppers & spice.", 250, img.paneer),
      m("butter-naan", "Butter Naan", "Soft leavened bread with butter.", 45, img.naan),
      m("masala-chai", "Masala Chai", "Spiced milk tea.", 40, img.chai),
    ],
  },
  {
    name: "Second Street Sourdough",
    cuisine: "Cafe / Bakery",
    city: "Brooklyn",
    country: "America",
    coverImage: img.sourdough,
    categories: ["Breakfast", "Grab & Go"],
    menu: [
      m("croissant", "Butter Croissant", "Flaky layers, baked daily.", 4, img.croissant),
      m("latte", "Latte", "Double shot with steamed milk.", 4, img.latte),
      m("fruit-tart", "Seasonal Fruit Tart", "Vanilla custard & berries.", 6, img.tart),
    ],
  },
  {
    name: "Copper Pot Curry",
    cuisine: "Indian",
    city: "Delhi",
    country: "India",
    coverImage: img.copperpot,
    categories: ["Family", "Curry House"],
    menu: [
      m("veg-thali", "Vegetarian Thali", "Dal, sabzi, roti, rice, salad.", 220, img.thali),
      m("masala-dosa", "Masala Dosa", "Crisp crepe, spiced potato.", 120, img.dosa),
      m("sweet-lassi", "Sweet Lassi", "Chilled yogurt drink.", 60, img.lassi),
    ],
  },
  {
    name: "Bay City Burgers",
    cuisine: "American",
    city: "San Francisco",
    country: "America",
    coverImage: img.bayburgers,
    categories: ["Fast Food", "Takeaway"],
    menu: [
      m("classic-burger", "Classic Burger", "Smash patty, cheddar, pickle.", 9, img.burger),
      m("fries", "Fries", "Crispy & salted.", 3, img.fries),
      m("shake-choc", "Chocolate Shake", "Thick and creamy.", 5, img.shake),
    ],
  },
  {
    name: "Olive & Oregano",
    cuisine: "Italian",
    city: "Austin",
    country: "America",
    coverImage: img.oliveore,
    categories: ["European", "Comfort"],
    menu: [
      m("carbonara", "Spaghetti Carbonara", "Egg, pecorino, pancetta.", 14, img.carbonara),
      m("garlic-bread", "Garlic Bread", "Buttery, garlicky baguette.", 5, img.garlic),
      m("tiramisu", "Tiramisu", "Coffee-soaked savoiardi.", 7, img.tiramisu),
    ],
  },
  {
    name: "Nomad Noodles",
    cuisine: "Chinese",
    city: "Mumbai",
    country: "India",
    coverImage: img.nomadnood,
    categories: ["Asian", "Quick Bites"],
    menu: [
      m("soy-ramen", "Soy Ramen", "Brothy noodles, veg toppings.", 210, img.ramen),
      m("veg-gyoza", "Veg Gyoza (6)", "Pan-fried dumplings.", 160, img.gyoza),
      m("mochi", "Mochi", "Chewy ice cream bites.", 140, img.mochi),
    ],
  },
  {
    name: "Hearth & Smoke Grill",
    cuisine: "American",
    city: "Chicago",
    country: "America",
    coverImage: img.hearthsmk,
    categories: ["BBQ", "Casual"],
    menu: [
      m("pit-bbq", "Pit BBQ Plate", "Smoked meats & house sauce.", 16, img.bbq),
      m("street-corn", "Street Corn", "Grilled, lime & chili.", 6, img.corn),
      m("slaw", "Cabbage Slaw", "Tangy, crunchy side.", 4, img.slaw),
    ],
  },
  {
    name: "Tiffin Terrace",
    cuisine: "Indian",
    city: "Hyderabad",
    country: "India",
    coverImage: img.tiffinter,
    categories: ["South Indian", "Homestyle"],
    menu: [
      m("paneer-tikka-tt", "Paneer Tikka", "Tandoor-grilled cottage cheese.", 230, img.paneer),
      m("naan-tt", "Tandoor Naan", "Fluffy & blistered.", 40, img.naan),
      m("chai-tt", "House Chai", "Masala tea, hot.", 35, img.chai),
    ],
  },
  {
    name: "Pine & Pistachio",
    cuisine: "Cafe",
    city: "Seattle",
    country: "America",
    coverImage: img.pinepista,
    categories: ["Brunch", "Desserts"],
    menu: [
      m("pista-tart", "Pistachio Tart", "Buttery crust, nutty cream.", 7, img.tart),
      m("flat-white", "Flat White", "Short & velvety.", 4, img.latte),
      m("almond-croissant", "Almond Croissant", "Rich frangipane fill.", 5, img.croissant),
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
  console.log(`Connected → ${MONGO_URI}/${DB_NAME}`);

  await Restaurant.deleteMany({});
  await Restaurant.insertMany(data);

  console.log("Seeded 9 restaurants.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
