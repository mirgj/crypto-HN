import { Router } from 'express';
import { asyncMiddleware, isAuthenticatedMiddleware } from '../../helpers/middlewares';
import { Errors } from '../../constants/index';
import validation from 'express-validation';
import viewValidators from '../../validation/view-validator';
import config from '../../../config.json';
import * as storiesController from '../../controllers/stories-controller';

const router = Router();
const commonRoute = (req, res, next, stories, title, currentElement) => {
  const currentPage = req.query.page;
  const skip = (currentPage - 1) * config.defaultValues.take;
  const data = !stories.error && stories.result.success ? stories.result.data.stories : null;
  const totalCount = !stories.error && stories.result.success ? stories.result.data.stories_count : 0;
  const hasNext = data ? totalCount > skip + data.length : false;

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
  });
};

router
  .get('/', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take);

    commonRoute(req, res, next, stories, 'Top News');
  }))
  .get('/show', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take, true);

    commonRoute(req, res, next, stories, 'Show', 'show');
  }))
  .get('/ask', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take, null, true);

    commonRoute(req, res, next, stories, 'Ask', 'ask');
  }))
  .get('/new', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStoriesChrono(skip, config.defaultValues.take);

    commonRoute(req, res, next, stories, 'New news', 'new');
  }))
  .get('/shownew', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStoriesChrono(skip, config.defaultValues.take, true);

    commonRoute(req, res, next, stories, 'New show', 'show');
  }))
  .get('/asknew', validation(viewValidators.getStories), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStoriesChrono(skip, config.defaultValues.take, null, true);

    commonRoute(req, res, next, stories, 'New ask', 'ask');
  }))
  .get('/stories/:storyId', validation(viewValidators.getStory), asyncMiddleware(async(req, res, next) => {
    const cres = await storiesController.getOneById(req.params.storyId);
    const story = !cres.error && cres.result.success ? cres.result.data : null;

    res.render('single', {
      title: story.title,
      story: story,
      user: req.user,
    });
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

      const cres = await storiesController.create(req.user._id, req.body);
      if (cres.error || (cres.result && !cres.result.success)) {
        req.flash('error', [Errors.CREATE_STORY_ERROR]);

        return res.redirect('/submit');
      }

      res.redirect('/new');
    }))
;

export default router;
