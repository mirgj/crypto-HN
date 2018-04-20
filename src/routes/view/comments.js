import { Router } from 'express';
import { asyncMiddleware, isAuthenticatedMiddleware } from '../../helpers/middlewares';
import { Commons } from '../../constants/index';
import validation from 'express-validation';
import sanitizeHtml from 'sanitize-html';
import viewValidators from '../../validation/view-validator';
import config from '../../../config.json';
import * as commentsController from '../../controllers/comments-controller';
import * as voltesController from '../../controllers/votes-controller';
import * as commonHelper from './common-helper';

const router = Router();


router
  .get('/comments', validation(viewValidators.getComments), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const comments = await commentsController.getAllComments(skip, config.defaultValues.take);

    await commonHelper.commonComments(req, res, next, comments);
  }))
  .get('/comments/:commentId/vote',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.getComment),
    asyncMiddleware(async(req, res, next) => {
      await voltesController.voteComment(req.user._id, req.user.karma, req.params.commentId, Commons.Up);

      res.redirect(req.header('Referer') || '/comments');
    }))
  .get('/comments/:commentId/downvote',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.getComment),
    asyncMiddleware(async(req, res, next) => {
      await voltesController.voteComment(req.user._id, req.user.karma, req.params.commentId, Commons.Down);

      res.redirect(req.header('Referer') || '/comments');
    }))
  .get('/comments/:commentId/unvote',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.getComment),
    asyncMiddleware(async(req, res, next) => {
      await voltesController.unvoteComment(req.user._id, req.params.commentId);

      res.redirect(req.header('Referer') || '/comments');
    }))
  .post('/comments/:storyId',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.createComment),
    asyncMiddleware(async(req, res, next) => {
      await commentsController.createForStory(req.user._id, req.params.storyId, sanitizeHtml(req.body.text), req.body.commentId);

      res.redirect('/stories/' + req.params.storyId);
    }));

export default router;
