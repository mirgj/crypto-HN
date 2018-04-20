import { Router } from 'express';
import { asyncMiddleware, isAuthenticatedMiddleware } from '../../helpers/middlewares';
import { Errors } from '../../constants/index';
import { Commons } from '../../constants/index';
import sanitizeHtml from 'sanitize-html';
import validation from 'express-validation';
import viewValidators from '../../validation/view-validator';
import config from '../../../config.json';
import * as storiesController from '../../controllers/stories-controller';
import * as voltesController from '../../controllers/votes-controller';
import * as commonHelper from './common-helper';

const router = Router();

router
  .get('/', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take);

    await commonHelper.commonStoriesRoute(req, res, next, stories, 'Top News');
  }))
  .get('/show', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take, true);

    await commonHelper.commonStoriesRoute(req, res, next, stories, 'Show', 'show');
  }))
  .get('/ask', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take, null, true);

    await commonHelper.commonStoriesRoute(req, res, next, stories, 'Ask', 'ask');
  }))
  .get('/new', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStoriesChrono(skip, config.defaultValues.take);

    await commonHelper.commonStoriesRoute(req, res, next, stories, 'New news', 'new');
  }))
  .get('/shownew', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStoriesChrono(skip, config.defaultValues.take, true);

    await commonHelper.commonStoriesRoute(req, res, next, stories, 'New show', 'shownew');
  }))
  .get('/asknew', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStoriesChrono(skip, config.defaultValues.take, null, true);

    await commonHelper.commonStoriesRoute(req, res, next, stories, 'New ask', 'asknew');
  }))
  .get('/stories/:storyId', validation(viewValidators.getStory), asyncMiddleware(async(req, res, next) => {
    const comm = await storiesController.getComments(req.params.storyId);

    await commonHelper.commonSingleRoute(req, res, next, comm);
  }))
  .get('/stories/:storyId/comments/:commentId',
    validation(viewValidators.getStoryComment),
    asyncMiddleware(async(req, res, next) => {
      const comm = await storiesController.getComments(req.params.storyId, req.params.commentId);

      await commonHelper.commonSingleRoute(req, res, next, comm, 'Add comment', 'singleComment');
    }))
  .get('/stories/:storyId/vote',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.getStory),
    asyncMiddleware(async(req, res, next) => {
      await voltesController.voteStory(req.user._id, req.user.karma, req.params.storyId, Commons.Up);

      res.redirect(req.header('Referer') || '/stories/' + req.params.storyId);
    }))
  .get('/stories/:storyId/downvote',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.getStory),
    asyncMiddleware(async(req, res, next) => {
      await voltesController.voteStory(req.user._id, req.user.karma, req.params.storyId, Commons.Down);

      res.redirect(req.header('Referer') || '/stories/' + req.params.storyId);
    }))
  .get('/stories/:storyId/unvote',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.getStory),
    asyncMiddleware(async(req, res, next) => {
      await voltesController.unvoteStory(req.user._id, req.params.storyId);

      res.redirect(req.header('Referer') || '/stories/' + req.params.storyId);
    }))
  .get('/submit', isAuthenticatedMiddleware('/login'), (req, res, next) => {
    res.render('submit', {
      title: 'Submit a story',
      user: req.user,
      current_element: 'submit',
      errors: req.flash('error'),
    });
  })
  .post('/submit',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.createStory),
    asyncMiddleware(async(req, res, next) => {
      if (!req.body.text && !req.body.url) {
        req.flash('error', [Errors.CREATE_STORY_INPUT_ERROR]);
        return res.redirect('/submit');
      }

      const cres = await storiesController.create(req.user._id, {
        title: sanitizeHtml(req.body.title),
        text: sanitizeHtml(req.body.text),
        url: sanitizeHtml(req.body.url),
      });

      if (cres.error || (cres.result && !cres.result.success)) {
        req.flash('error', [Errors.CREATE_STORY_ERROR]);

        return res.redirect('/submit');
      }

      res.redirect('/new');
    }))
;

export default router;
