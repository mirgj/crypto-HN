import { Router } from 'express';
import { asyncMiddleware, isAuthenticatedMiddleware } from '../../helpers/middlewares';
import validation from 'express-validation';
import mkdown from '../../helpers/markdown';
import sanitizeHtml from 'sanitize-html';
import viewValidators from '../../validation/view-validator';
import config from '../../../config.json';
import * as commentsController from '../../controllers/comments-controller';
import * as voltesController from '../../controllers/votes-controller';

const router = Router();


router
  .get('/comments', validation(viewValidators.getComments), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const comments = await commentsController.getAllComments(skip, config.defaultValues.take);
    const data = !comments.error && comments.result.success ? comments.result.data.comments : null;
    const totalCount = !comments.error && comments.result.success ? comments.result.data.comments_count : 0;
    const hasNext = data ? totalCount > skip + data.length : false;
    const canDownvote = req.user ? req.user.karma >= config.defaultValues.minKarmaForDownvote : false;
    const commentsVoteMapping = req.user ? await voltesController.getUserCommentsVoteMapping(req.user._id, data) : [];

    res.render('comments', {
      title: 'Comments',
      user: req.user,
      comments: data,
      total_count: totalCount,
      has_next: hasNext,
      current_page: currentPage,
      next_page: currentPage + 1,
      current_element: 'comments',
      can_downvote: canDownvote,
      comments_vote_mapping: commentsVoteMapping,
      markdown: mkdown,
    });
  }))
  .post('/comments/:storyId',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.createComment),
    asyncMiddleware(async(req, res, next) => {
      await commentsController.createForStory(req.user._id, req.params.storyId, sanitizeHtml(req.body.text), req.body.commentId);

      res.redirect('/stories/' + req.params.storyId);
    }));

export default router;
