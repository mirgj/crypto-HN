import { logger } from './logger';
import { ForbiddenError } from '../results/api-errors';

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch((err) => {
        logger.error(`Error on asyncMiddleware: ${err}`);

        next(err);
      });
  };

const sameUserMiddleware = err =>
  (req, res, next) => {
    if (req.user._id.toString() !== req.params.userId)
      throw new ForbiddenError(err);
    return next();
  };

const isAuthenticatedMiddleware = redirectUrl =>
  (req, res, next) => {
    if (req.isAuthenticated()) return next();
    return res.redirect(redirectUrl);
  };

const notAuthenticatedMiddleware = redirectUrl =>
  (req, res, next) => {
    if (!req.isAuthenticated()) return next();
    return res.redirect(redirectUrl);
  };

const forceHttpsRedirect = env => (req, res, next) => {
  if(env === "prod" && !req.secure){
    res.redirect("https://" + req.headers.host + req.url);
    return;
  }

  next();
}

export {
  asyncMiddleware,
  sameUserMiddleware,
  isAuthenticatedMiddleware,
  notAuthenticatedMiddleware,
  forceHttpsRedirect,
};
