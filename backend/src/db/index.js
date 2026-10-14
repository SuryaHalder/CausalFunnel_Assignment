import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    // `dbName` is passed as an option (not appended to the URI) so the same code
    // works for both local URIs and Atlas URIs that already contain ?query=params.
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: DB_NAME,
    });
    console.log(
      `MongoDB connected | host: ${connection.connection.host} | db: ${DB_NAME}`
    );
  } catch (error) {
    console.error("MongoDB connection FAILED:", error.message);
    process.exit(1);
  }
};

export default connectDB;
