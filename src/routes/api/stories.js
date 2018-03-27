import { Router } from 'express';
import { asyncMiddleware } from '../../helpers/middlewares';
import { jwtAuthRequired } from '../../helpers/authenticator';
import validation from 'express-validation';
import apiValidators from '../../validation/api-validator';
import * as storiesController from '../../controllers/stories-controller';

const router = Router();

router
  .get('/', validation(apiValidators.getStories), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getStories(req.query.skip, req.query.take))
  ))
  .post('/', jwtAuthRequired, validation(apiValidators.createStory), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.create(req.user._id, {
      title: req.title,
      text: req.text,
      url: req.url,
    }))
  ))
  .get('/:storyId', jwtAuthRequired, validation(apiValidators.getStory), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getOneById(req.params.storyId))
  ));

export default router;
