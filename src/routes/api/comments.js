import { Router } from 'express';
import { asyncMiddleware } from '../../helpers/middlewares';
// import { jwtAuthRequired } from '../../helpers/authenticator';
import validation from 'express-validation';
import apiValidators from '../../validation/api-validator';
import * as commentsController from '../../controllers/comments-controller';

const router = Router();

router
  .get('/', validation(apiValidators.getComments), asyncMiddleware(async(req, res, next) =>
    res.json(await commentsController.getAllComments(req.query.skip, req.query.take))
  ));

export default router;
