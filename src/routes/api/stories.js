import { Router } from 'express';
import { asyncMiddleware } from '../../helpers/middlewares';
import { jwtAuthRequired } from '../../helpers/authenticator';
import sanitizeHtml from 'sanitize-html';
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
      title: sanitizeHtml(req.body.title),
      text: sanitizeHtml(req.body.text),
      url: sanitizeHtml(req.body.url),
    }))
  ))
  .get('/:storyId', validation(apiValidators.getStory), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getOneById(req.params.storyId))
  ))
  .get('/:storyId/comments', validation(apiValidators.getStory), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getComments(req.params.storyId))
  ))
  .get('/:storyId/comments/:commentId', validation(apiValidators.getStory), asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getComments(req.params.storyId, req.params.commentId))
  ))
  .post('/:storyId/comments', jwtAuthRequired, validation(apiValidators.createComment), asyncMiddleware(async(req, res, next) =>
    res.json(await commentsController.createForStory(req.user._id, req.params.storyId, sanitizeHtml(req.body.text)))
  ))
  .post('/:storyId/comments/:commentId', jwtAuthRequired, validation(apiValidators.createComment), asyncMiddleware(async(req, res, next) =>
    res.json(await commentsController.createForStory(req.user._id, req.params.storyId, sanitizeHtml(req.body.text), req.params.commentId))
  ))
  .put('/:storyId/vote', jwtAuthRequired, validation(apiValidators.voteStory), asyncMiddleware(async(req, res, next) =>
    res.json(await votesController.voteStory(req.user._id, req.user.karma, req.params.storyId, req.body.direction))
  ))
  .delete('/:storyId/vote', jwtAuthRequired, validation(apiValidators.getStory), asyncMiddleware(async(req, res, next) =>
    res.json(await votesController.unvoteStory(req.user._id, req.params.storyId))
  ))
;

export default router;
