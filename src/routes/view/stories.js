import { Router } from 'express';
import { asyncMiddleware, isAuthenticatedMiddleware } from '../../helpers/middlewares';
import { Errors } from '../../constants/index';
import validation from 'express-validation';
import viewValidators from '../../validation/view-validator';
import config from '../../../config.json';
import * as storiesController from '../../controllers/stories-controller';

const router = Router();

router
  .get('/', validation(viewValidators.getTopNews), asyncMiddleware(async(req, res, next) => {
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take);
    const data = !stories.error && stories.result.success ? stories.result.data.stories : null;
    const totalCount = !stories.error && stories.result.success ? stories.result.data.stories_count : 0;
    const hasNext = data ? totalCount > skip + data.length : false;

    res.render('index', {
      title: 'Top News',
      user: req.user,
      stories: data,
      total_count: totalCount,
      has_next: hasNext,
      current_page: currentPage,
      next_page: currentPage + 1,
      page_size: config.defaultValues.take,
    });
  }))
  .get('/submit', isAuthenticatedMiddleware('/login'), (req, res, next) => {
    res.render('submit', {
      title: 'Submit a story',
      user: req.user,
      currentElement: 'submit',
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
