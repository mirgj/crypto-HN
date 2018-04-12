import { Router } from 'express';
import { asyncMiddleware } from '../../helpers/middlewares';
import { jwtAuthRequired } from '../../helpers/authenticator';
import validation from 'express-validation';
import apiValidators from '../../validation/api-validator';
import * as storiesController from '../../controllers/stories-controller';
import * as commentsController from '../../controllers/comments-controller';
import * as votesController from '../../controllers/votes-controller';

const router = Router();

router
  .get('/', validation(apiValidators.getStories), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getStories(req.query.skip, req.query.take))
  ))
  .get('/show', validation(apiValidators.getStories), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getStories(req.query.skip, req.query.take, true))
  ))
  .get('/ask', validation(apiValidators.getStories), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getStories(req.query.skip, req.query.take, null, true))
  ))
  .get('/new', validation(apiValidators.getStories), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getStoriesChrono(req.query.skip, req.query.take))
  ))
  .get('/shownew', validation(apiValidators.getStories), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getStoriesChrono(req.query.skip, req.query.take, true))
  ))
  .get('/asknew', validation(apiValidators.getStories), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getStoriesChrono(req.query.skip, req.query.take, null, true))
  ))
  .post('/', jwtAuthRequired, validation(apiValidators.createStory), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.create(req.user._id, {
      title: req.body.title,
      text: req.body.text,
      url: req.body.url,
    }))
  ))
  .get('/:storyId', validation(apiValidators.getStory), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getOneById(req.params.storyId))
  ))
  .get('/:storyId/comments', validation(apiValidators.getStory), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getComments(req.params.storyId))
  ))
  .post('/:storyId/comments', jwtAuthRequired, validation(apiValidators.createComment), asyncMiddleware(async(req, res, next) =>
    res.json(await commentsController.createForStory(req.user._id, req.params.storyId, req.body.text))
  ))
  .put('/:storyId/vote', jwtAuthRequired, validation(apiValidators.vote), asyncMiddleware(async(req, res, next) =>
    res.json(await votesController.voteStory(req.user._id, req.user.karma, req.params.storyId, req.body.direction))
  ))
  .delete('/:storyId/vote', jwtAuthRequired, validation(apiValidators.getStory), asyncMiddleware(async(req, res, next) =>
    res.json(await votesController.unvoteStory(req.user._id, req.params.storyId))
  ))
;

export default router;
