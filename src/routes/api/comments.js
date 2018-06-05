import { Router } from 'express';
import { asyncMiddleware } from '../../helpers/middlewares';
import { jwtAuthRequired } from '../../helpers/authenticator';
import { UI } from '../../constants/index';
import validation from 'express-validation';
import apiValidators from '../../validation/api-validator';
import * as commentsController from '../../controllers/comments-controller';
import * as votesController from '../../controllers/votes-controller';

const router = Router();

router
  .get('/', validation(apiValidators.getComments), asyncMiddleware(async(req, res, next) =>
    res.json(await commentsController.getAllComments(req.query.skip, req.query.take))
  ))
  .delete('/:commentId', jwtAuthRequired, validation(apiValidators.getComment), asyncMiddleware(async(req, res, next) =>
    res.json(await commentsController.update(req.user._id, req.params.commentId, UI.Messages.DeletedComment, true))
  ))
  .put('/:commentId', jwtAuthRequired, validation(apiValidators.updateComment), asyncMiddleware(async(req, res, next) =>
    res.json(await commentsController.update(req.user._id, req.params.commentId, req.body.text))
  ))
  .put('/:commentId/vote', jwtAuthRequired, validation(apiValidators.voteComment), asyncMiddleware(async(req, res, next) =>
    res.json(await votesController.voteComment(req.user._id, req.user.karma, req.params.commentId, req.body.direction))
  ))
  .delete('/:commentId/vote', jwtAuthRequired, validation(apiValidators.getComment), asyncMiddleware(async(req, res, next) =>
    res.json(await votesController.unvoteComment(req.user._id, req.params.commentId))
  ));

export default router;
