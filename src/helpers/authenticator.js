import passport from 'passport';
import { Strategy } from 'passport-local';
import { BasicStrategy } from 'passport-http';
import { NotFoundError } from '../results/api-errors';
import { logger } from './logger';
import { Errors } from '../constants/index';
import * as usersController from '../controllers/users-controller';
import * as hashHelper from './hasher';

const commonStrategy = async(username, password, next) => {
  try {
    const r = await usersController.getByUsername(username);
    if (!r.result) return next(null, false, {message: Errors.USER_NOT_FOUND});

    const loggedIn = await hashHelper.compareHash(password, r.result.password);
    if (!loggedIn) return next(null, false, {message: Errors.USER_WRONG_PASSWORD});

    return next(null, r.result);
  } catch (err) {
    logger.error(`Passport authenticator error: ${err}`);

    if (err instanceof NotFoundError)
      return next(null, false, {message: Errors.USERNAME_NOT_FOUND});

    return next(err);
  }
};

passport.use(new BasicStrategy(commonStrategy));
passport.use(new Strategy(commonStrategy));
passport.serializeUser(function(user, cb) {
  cb(null, user._id);
});
passport.deserializeUser(async(userId, next) => {
  try {
    const r = await usersController.get(userId);
    if (!r.result) return next(null, false, {message: Errors.USER_NOT_FOUND});

    return next(null, r.result);
  } catch (err) {
    logger.error(`Passport deserializer error: ${err}`);

    if (err instanceof NotFoundError)
      return next(null, false, {message: Errors.USERNAME_NOT_FOUND});

    return next(err);
  }
});

export default passport;
