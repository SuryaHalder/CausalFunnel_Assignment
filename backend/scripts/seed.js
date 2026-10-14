// Fills the database with realistic fake sessions so the dashboard has something to show.
//   npm run seed             -> adds data
//   npm run seed -- --reset  -> deletes ALL events first
import "dotenv/config";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { Event } from "../src/models/event.model.js";
import { DB_NAME } from "../src/constants.js";
import { normalizePageUrl } from "../src/utils/url.js";

const BASE = process.env.SEED_BASE_URL || "http://localhost:8000";
const SESSION_COUNT = 40;

// Where visitors tend to click on each fake page (xRatio = fraction of page width).
const PAGES = [
  {
    path: "/demo/index.html",
    height: 1300,
    hotspots: [
      { xRatio: 0.5, y: 330, tag: "button", text: "Shop the collection", weight: 5 },
      { xRatio: 0.9, y: 40, tag: "a", text: "Cart", weight: 3 },
      { xRatio: 0.3, y: 760, tag: "button", text: "Add to cart", weight: 2 },
    ],
  },
  {
    path: "/demo/shop.html",
    height: 1500,
    hotspots: [
      { xRatio: 0.28, y: 520, tag: "button", text: "Add to cart", weight: 4 },
      { xRatio: 0.72, y: 520, tag: "button", text: "Add to cart", weight: 3 },
      { xRatio: 0.9, y: 40, tag: "a", text: "Cart", weight: 2 },
    ],
  },
  {
    path: "/demo/checkout.html",
    height: 900,
    hotspots: [
      { xRatio: 0.5, y: 640, tag: "button", text: "Place order", weight: 4 },
      { xRatio: 0.5, y: 300, tag: "input", text: "", weight: 2 },
    ],
  },
];

const gaussian = () => {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const pickWeighted = (items) => {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[0];
};

const buildSession = () => {
  const sessionId = randomUUID();
  const viewportWidth = [1280, 1366, 1440, 1920][Math.floor(Math.random() * 4)];
  let time = Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000; // within last 3 days
  const events = [];

  // Journey length: 1 to 3 pages, always in funnel order
  const pagesVisited = PAGES.slice(0, 1 + Math.floor(Math.random() * PAGES.length));

  for (const page of pagesVisited) {
    const pageUrl = `${BASE}${page.path}`;
    const pageKey = normalizePageUrl(pageUrl);
    const base = {
      sessionId,
      pageUrl,
      pageKey,
      pageWidth: viewportWidth,
      pageHeight: page.height,
      viewportWidth,
      viewportHeight: 800,
      userAgent: "seed-script",
    };

    events.push({ ...base, eventType: "page_view", timestamp: new Date(time) });

    const clickCount = Math.floor(Math.random() * 5);
    for (let i = 0; i < clickCount; i++) {
      time += 1000 + Math.random() * 9000;
      const spot = pickWeighted(page.hotspots);
      events.push({
        ...base,
        eventType: "click",
        timestamp: new Date(time),
        x: Math.max(0, Math.round(spot.xRatio * viewportWidth + gaussian() * 25)),
        y: Math.max(0, Math.round(spot.y + gaussian() * 20)),
        target: { tag: spot.tag, text: spot.text },
      });
    }
    time += 3000 + Math.random() * 12000;
  }
  return events;
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });

  if (process.argv.includes("--reset")) {
    const { deletedCount } = await Event.deleteMany({});
    console.log(`Deleted ${deletedCount} existing events`);
  }

  const events = Array.from({ length: SESSION_COUNT }, buildSession).flat();
  await Event.insertMany(events);
  console.log(`Inserted ${events.length} events across ${SESSION_COUNT} sessions`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
