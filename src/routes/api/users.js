import { Router } from 'express';
import { asyncMiddleware, sameUserMiddleware } from '../../helpers/middlewares';
import { Errors } from '../../constants/index';
import validation from 'express-validation';
import apiValidators from '../../validation/api-validator';
import * as usersController from '../../controllers/users-controller';
import passport from '../../helpers/authenticator';

const router = Router();
const basicAuth = passport.authenticate('basic', { session: false });

router
  .post('/', validation(apiValidators.createUser), asyncMiddleware(async(req, res, next) =>
    res.json(await usersController.create(req.body.username, req.body.password))
  ))
  .get('/me', basicAuth, asyncMiddleware(async(req, res, next) => {
    let user = await usersController.get(req.user._id);
    delete user.result.password;

    res.json(user);
  }))
  .get('/:userId', basicAuth, validation(apiValidators.getUser), asyncMiddleware(async(req, res, next) => {
    let user = await usersController.get(req.params.userId);
    if (req.user._id.toString() !== user.result._id.toString()) delete user.result.email;
    delete user.result.password;

    return res.json(user);
  }))
  .patch('/:userId',
    basicAuth,
    validation(apiValidators.updateUser),
    sameUserMiddleware(Errors.UPDATE_OTHER_USER_ERROR),
    asyncMiddleware(async(req, res, next) => {
      res.json(await usersController.update(req.params.userId, req.body.email, req.body.about));
    })
  );

export default router;
