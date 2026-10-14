// Entry point: load env vars FIRST, connect to the database, then start listening.
import "dotenv/config";
import connectDB from "./db/index.js";
import app from "./app.js";

const PORT = process.env.PORT || 8000;

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set. Copy backend/.env.example to backend/.env first.");
  process.exit(1);
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
