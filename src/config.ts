import bunyan from "bunyan";
import format from "bunyan-format";

class Config {
  public createLogger(name: string): bunyan {
    const logger = bunyan.createLogger({
      name,
      level: "debug",
      streams: [
        {
          level: "debug",
          stream: format({
            outputMode: "short",
            color: true,
            levelInString: true,
          }),
        },
      ],
    });
    return logger;
  }
}

export const config: Config = new Config();
