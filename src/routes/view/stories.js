import { Router } from 'express';
import { asyncMiddleware } from '../../helpers/middlewares';
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
  }));

export default router;
