import winston from 'winston';
import 'dotenv/config';

const { combine, timestamp, printf, colorize, align, json } = winston.format;

// Read logging configuration directly from environment variables to avoid circular dependency
const isDebugMode = process.env.DEBUG_MODE === 'true';
const logLevel = isDebugMode ? 'debug' : (process.env.LOG_LEVEL || 'info');
const enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
const logFilePath = process.env.LOG_FILE_PATH || './logs/server.log';

const transports = [];

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  align(),
  printf((info) => {
    let message = info.message;
    
    // If there are additional properties (objects passed as second parameter), stringify them
    const additionalInfo = Object.keys(info)
      .filter(key => !['timestamp', 'level', 'message', 'splat', Symbol.for('level')].includes(key))
      .reduce((obj, key) => {
        obj[key] = info[key];
        return obj;
      }, {});
    
    if (Object.keys(additionalInfo).length > 0) {
      message += ' ' + JSON.stringify(additionalInfo, null, 2);
    }
    
    return `[${info.timestamp}] ${info.level}: ${message}`;
  })
);

const fileFormat = combine(
  timestamp(),
  json()
);

// Always add console transport
transports.push(
  new winston.transports.Console({
    level: logLevel,
    format: consoleFormat,
    handleExceptions: true,
  })
);

// Add file transport if enabled
if (enableFileLogging) {
  transports.push(
    new winston.transports.File({
      filename: logFilePath,
      level: logLevel,
      format: fileFormat,
      handleExceptions: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: logLevel,
  transports,
  exitOnError: false,
});

// Stream for morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export default logger;
