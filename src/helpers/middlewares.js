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
    if (req.user._id !== req.params.userId)
      throw new ForbiddenError(err);
    return next();
  };
};

export {
  asyncMiddleware,
  sameUserMiddleware,
};
