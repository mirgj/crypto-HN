import { ForbiddenError } from '../results/api-errors';

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch((err) => {
        console.error(err);

        next(err);
      });
  };

const sameUserMiddleware = err => {
  return (req, res, next) => {
    if (req.user._id.toString() !== req.params.userId)
      throw new ForbiddenError(err);
    return next();
  };
};

const isAuthenticatedMiddleware = redirectUrl =>
  (req, res, next) => {
    if (req.isAuthenticated()) return next();
    return res.redirect(redirectUrl);
  };

export {
  asyncMiddleware,
  sameUserMiddleware,
  isAuthenticatedMiddleware,
};
