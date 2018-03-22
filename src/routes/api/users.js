import { Router } from 'express';
import { asyncMiddleware, sameUserMiddleware } from '../../helpers/middlewares';
import { Errors } from '../../constants/index';
import { jwtAuthStrategy, jwtAuthRequired } from '../../helpers/authenticator';
import validation from 'express-validation';
import apiValidators from '../../validation/api-validator';
import * as usersController from '../../controllers/users-controller';

const router = Router();

router
  .post('/', validation(apiValidators.createUserOrLogin), asyncMiddleware(async(req, res, next) =>
    res.json(await usersController.create(req.body.username, req.body.password))
  ))
  .post('/login', validation(apiValidators.createUserOrLogin), jwtAuthStrategy, asyncMiddleware(async(req, res, next) =>
    res.json(usersController.encloseToken(req.token))
  ))
  .get('/me', jwtAuthRequired, asyncMiddleware(async(req, res, next) =>
    res.json(await usersController.get(req.user._id))
  ))
  .get('/:userId', jwtAuthRequired, validation(apiValidators.getUser), asyncMiddleware(async(req, res, next) => {
    let user = await usersController.get(req.params.userId);
    if (req.user._id.toString() !== user.result.data._id.toString()) delete user.result.email;

    return res.json(user);
  }))
  .patch('/:userId',
    jwtAuthRequired,
    validation(apiValidators.updateUser),
    sameUserMiddleware(Errors.UPDATE_OTHER_USER_ERROR),
    asyncMiddleware(async(req, res, next) => {
      res.json(await usersController.update(req.params.userId, req.body.email, req.body.about));
    })
  );

export default router;
