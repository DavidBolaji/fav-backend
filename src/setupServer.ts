import {
  Application,
  json,
  urlencoded,
  Response,
  Request,
  NextFunction,
} from "express";
import cors from "cors";
import hpp from "hpp";
import HTTP_STATUS from "http-status-codes";
import "express-async-errors";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import helmet from "helmet";
import compression from "compression";
import http from "http";
import cookieSession from "cookie-session";
import appRoutes from "./routes";
import {
  IErrorResponse,
  customError,
} from "./shared/globals/helpers/error-handler";
import Logger from "bunyan";
import { config } from "./config";

const PORT = process.env.PORT || 8080;
const log: Logger = config.createLogger("server");

export class FavServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routeMiddleware(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    // dotenv.config({});
    let secretOne: any = process.env.SECRET_KEY_ONE;

    let secretTwo: any = process.env.SECRET_KEY_TWO;
    let environment: any = process.env.ENV;
    let origin: any = process.env.FRONT_END_URL;
    // setup cors
    app.use(
      cors({
        origin,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      })
    );
    // setup cookie session
    app.use(
      cookieSession({
        name: "session",
        keys: [secretOne, secretTwo],
        maxAge: 60 * 60 * 24 * 7,
        secure: environment !== "dev",
      })
    );
    //setup hpp to prevent parameter pollution
    app.use(hpp());
    //setup helmet
    app.use(helmet());
  }

  private standardMiddleware(app: Application): void {
    // compress response size
    app.use(compression());
    // limit json response
    app.use(json({ limit: "50mb" }));
    app.use(urlencoded({ extended: true, limit: "50mb" }));
  }

  private routeMiddleware(app: Application): void {
    appRoutes(app);
  }

  private globalErrorHandler(app: Application): void {
    app.all("*", (req: Request, res: Response) => {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ message: `${req.originalUrl} not found` });
    });

    app.use(
      (
        error: IErrorResponse,
        _req: Request,
        res: Response,
        next: NextFunction
      ) => {
        if (error instanceof customError) {
          return res.status(error.statusCode).json(error.serializeErrors());
        }
        next();
      }
    );
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      //   const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      //   this.socketIOConnections(socketIO);
    } catch (err) {
      log.error(err);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    let origin: any = process.env.FRONT_END_URL;
    let redisHost: any = process.env.REDIS_HOST;
    log.info(redisHost);
    const io: Server = new Server(httpServer, {
      cors: {
        origin,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      },
    });

    const pubClient = createClient({ url: redisHost });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    httpServer.listen(PORT, () => {
      log.info(`server is running on port ${PORT}`);
    });
  }

  private socketIOConnections(io: Server): void {}
}
