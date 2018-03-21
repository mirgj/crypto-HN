import { Router } from 'express';
import { asyncMiddleware } from '../../helpers/middlewares';
import validation from 'express-validation';
import apiValidators from '../../validation/api-validator';
import * as storiesController from '../../controllers/stories-controller';

const router = Router();

router
  .get('/:storyId', validation(apiValidators.getStory), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getOneById(req.params.storyId))
  ));

export default router;
