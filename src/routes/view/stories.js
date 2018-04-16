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

const router = Router();
const commonRoute = async(req, res, next, stories, title, currentElement) => {
  const currentPage = req.query.page;
  const skip = (currentPage - 1) * config.defaultValues.take;
  const data = !stories.error && stories.result.success ? stories.result.data.stories : null;
  const totalCount = !stories.error && stories.result.success ? stories.result.data.stories_count : 0;
  const hasNext = data ? totalCount > skip + data.length : false;
  const canDownvote = req.user ? req.user.karma >= config.defaultValues.minKarmaForDownvote : false;
  const userVoteMapping = req.user ? await voltesController.getUserStoriesVoteMapping(req.user._id, data) : [];

  res.render('index', {
    title: title,
    user: req.user,
    stories: data,
    total_count: totalCount,
    has_next: hasNext,
    current_page: currentPage,
    next_page: currentPage + 1,
    page_size: config.defaultValues.take,
    current_element: currentElement,
    can_downvote: canDownvote,
    user_vote_mapping: userVoteMapping,
  });
};

router
  .get('/', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take);

    await commonRoute(req, res, next, stories, 'Top News');
  }))
  .get('/show', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take, true);

    await commonRoute(req, res, next, stories, 'Show', 'show');
  }))
  .get('/ask', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take, null, true);

    await commonRoute(req, res, next, stories, 'Ask', 'ask');
  }))
  .get('/new', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStoriesChrono(skip, config.defaultValues.take);

    await commonRoute(req, res, next, stories, 'New news', 'new');
  }))
  .get('/shownew', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStoriesChrono(skip, config.defaultValues.take, true);

    await commonRoute(req, res, next, stories, 'New show', 'show');
  }))
  .get('/asknew', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStoriesChrono(skip, config.defaultValues.take, null, true);

    await commonRoute(req, res, next, stories, 'New ask', 'ask');
  }))
  .get('/stories/:storyId', validation(viewValidators.getStory), asyncMiddleware(async(req, res, next) => {
    const cres = await storiesController.getOneById(req.params.storyId);
    const story = !cres.error && cres.result.success ? cres.result.data : null;
    const userVoteMapping = req.user ? await voltesController.getUserStoriesVoteMapping(req.user._id, [story]) : [];
    const canDownvote = req.user ? req.user.karma >= config.defaultValues.minKarmaForDownvote : false;

    res.render('single', {
      title: story.title,
      story: story,
      user: req.user,
      user_vote_mapping: userVoteMapping,
      can_downvote: canDownvote,
      errors: req.flash('error'),
    });
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
        req.flash('error', ['Either text or URL are required']);
        return res.redirect('/submit');
      }

      const cres = await storiesController.create(req.user._id, {
        title: sanitizeHtml(req.body.title),
        text: sanitizeHtml(req.body.text),
        url: req.body.url,
      });

      if (cres.error || (cres.result && !cres.result.success)) {
        req.flash('error', [Errors.CREATE_STORY_ERROR]);

        return res.redirect('/submit');
      }

      res.redirect('/new');
    }))
;

export default router;
