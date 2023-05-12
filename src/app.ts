import { FavServer } from "./setupServer";

import express, { Express } from "express";
import dbCon from "./setupDatabase";

class Application {
  public initialize(): void {
    dbCon();
    const app: Express = express();
    const server: FavServer = new FavServer(app);
    server.start();
  }
}

const application: Application = new Application();
application.initialize();
