import http from 'http';
import https from 'https';
import fs from 'fs';
import express from 'express';
import path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import compress from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import moment from 'moment';
import flash from 'connect-flash';
import apiRoutes from './routes/api/index';
import viewRoutes from './routes/view/index';
import config from '../config';
import { connect, initDefaultDb } from './db/connector';
import { logger, expressLogger } from './helpers/logger';
import { forceHttpsRedirect } from './helpers/middlewares';

const app = express();

(async(app) => {
  try {
    await connect(config.database.connectionString);
    await initDefaultDb(config.database.defaultDbName);
    let privateKey;
    let certificate;
    let ca;
    let httpsServer;

    if (config.application.env === "prod") {
      privateKey = fs.readFileSync(config.application.privateKeyPath, 'utf8');
      certificate = fs.readFileSync(config.application.certificatePath, 'utf8');
      ca = fs.readFileSync(config.application.caPath, 'utf8');
      httpsServer = https.createServer({
        key: privateKey,
        cert: certificate,
        ca: ca
      }, app);
    }

    const httpServer = http.createServer(app);

    app.locals.moment = moment;
    app.set('view engine', 'pug');
    app.set('views', path.join(__dirname, '/views'));
    app.use('/static', express.static(path.join(__dirname, 'public'), { maxAge: config.session.staticMaxAge, dotfiles: 'allow' }));
    app.use('/.well-known', express.static(path.join(__dirname, 'public/.well-known'), { dotfiles: 'allow' }));
    app.use(morgan('combined', { stream: expressLogger.stream }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(compress());
    app.use(helmet());
    app.use(cors({origin: config.application.allowedOrigin}));
    app.use(session({
      secret: config.keys.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        path: '/',
        httpOnly: true,
      },
    }));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    // force https redirec
    app.use(forceHttpsRedirect(config.application.env));
    app.use('/api', apiRoutes);
    app.use('/', viewRoutes);

    if(httpsServer) {
      httpsServer.listen(config.application.sslPort, config.application.hostname, () => {
        logger.log('verbose', `Application (https) started on port ${httpsServer.address().address}:${httpsServer.address().port}`);
      });
    }
    httpServer.listen(config.application.port, config.application.hostname, () => {
      logger.log('verbose', `Application (http) started on port ${httpServer.address().address}:${httpServer.address().port}`);
    });
  } catch (err) {
    logger.error(`Unexpected exception: ${JSON.stringify(err)}`);
  }
})(app);


export default app;
