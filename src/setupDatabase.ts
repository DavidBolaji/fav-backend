import mongoose, { connect } from "mongoose";
import dotenv from "dotenv";
import Logger from "bunyan";
import { config } from "./config";
dotenv.config();
let server: any = process.env.MONGODB_URI_LOCAL;
let log: Logger = config.createLogger("database");
if (process.env.ENV === "prod") {
  server = process.env.MONGODB_URI_PROD;
}

export default () => {
  const connect = () => {
    mongoose
      .connect(server)
      .then(() => {
        log.info("Database Connected successfully");
      })
      .catch((err) => {
        log.error("Error connecting to database", err);
        return process.exit(1);
      });
  };
  connect();
  mongoose.connection.on("disconnected", connect);
};
