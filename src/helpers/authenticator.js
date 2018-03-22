import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { NotFoundError } from '../results/api-errors';
import { logger } from './logger';
import { Errors } from '../constants/index';
import { UnauthorizedError } from '../results/api-errors';
import config from '../../config';
import * as usersController from '../controllers/users-controller';
import * as hashHelper from './hasher';

const commonStrategy = async(username, password, next) => {
  try {
    const r = await usersController.getLogin(username);
    if (!r.result || !r.result.success) return next(null, false, {message: Errors.USER_NOT_FOUND});

    const loggedIn = await hashHelper.compareHash(password, r.result.data.password);
    if (!loggedIn) return next(null, false, {message: Errors.USER_WRONG_PASSWORD});

    return next(null, r.result.data);
  } catch (err) {
    logger.error(`Passport authenticator error: ${JSON.stringify(err)}`);

    if (err instanceof NotFoundError)
      return next(null, false, {message: Errors.USERNAME_NOT_FOUND});

    return next(err);
  }
};

const deserializer = async(userId, next) => {
  try {
    const r = await usersController.get(userId);
    if (!r.result || !r.result.success) return next(null, false, {message: Errors.USER_NOT_FOUND});

    return next(null, r.result.data);
  } catch (err) {
    logger.error(`Passport deserializer error: ${JSON.stringify(err)}`);

    if (err instanceof NotFoundError)
      return next(null, false, {message: Errors.USERNAME_NOT_FOUND});

    return next(err);
  }
};

const serializer = (user, cb) => {
  cb(null, user._id);
};

const jwtAuthStrategy = async(req, res, next) => {
  try {
    await commonStrategy(req.body.username, req.body.password, (err, user, result) => {
      if (err) {
        logger.error(`strategy return error: ${JSON.stringify(err)}`);

        return next(err);
      }
      if (!user) return next(new UnauthorizedError(result.message));

      req.token = jwt.sign({id: user._id}, config.keys.jwtSecret, {
        expiresIn: config.session.jwtDuration,
      });

      next();
    });
  } catch (err) {
    logger.error(`jwt authentication strategy error: ${JSON.stringify(err)}`);

    next(err);
  }
};

const jwtAuthRequired = async(req, res, next) => {
  try {
    const token = req.headers['x-access-token'];
    if (!token) return next(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

    jwt.verify(token, config.keys.jwtSecret, async(err, decoded) => {
      if (err) {
        logger.error(`token verify error: ${JSON.stringify(err)}`);

        return next(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));
      }

      await deserializer(decoded.id, (err, user, result) => {
        if (err) {
          logger.error(`token verify deserializer error: ${JSON.stringify(err)}`);

          return next(err);
        }
        if (!user) return next(new UnauthorizedError(result.message));

        req.user = user;
      });

      next();
    });
  } catch (err) {
    logger.error(`jwt deserializer error: ${JSON.stringify(err)}`);

    next(err);
  }
};

passport.use(new Strategy(commonStrategy));
passport.serializeUser(serializer);
passport.deserializeUser(deserializer);

export {
  passport,
  jwtAuthStrategy,
  jwtAuthRequired,
};
