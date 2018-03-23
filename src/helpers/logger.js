import winston from 'winston';

const customFormat = winston.format.printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

const logger = winston.createLogger({
  exitOnError: false,
  level: 'verbose',
  format: winston.format.combine(
    winston.format.timestamp(),
    customFormat,
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      name: 'console-logs',
      format: winston.format.simple(),
      colorize: true,
      prettyPrint: true,
      handleExceptions: true,
    }),
    new winston.transports.File({
      name: 'error-logs',
      filename: './logs/error.log',
      level: 'error',
      handleExceptions: true,
    }),
    new winston.transports.File({
      name: 'combined-logs',
      filename: './logs/combined.log',
      handleExceptions: true,
    }),
  ],
});

const expressLogger = winston.createLogger({
  exitOnError: false,
  level: 'info',
  transports: [
    new winston.transports.Console({
      name: 'console-logs',
      json: false,
      colorize: true,
      handleExceptions: true,
    }),
    new winston.transports.File({
      name: 'express-logs',
      filename: './logs/express-access.log',
      handleExceptions: true,
    }),
  ],
});

expressLogger.stream = {
  write: function(message, encoding){
    expressLogger.info(message);
  },
};

export {
  logger,
  expressLogger,
};
