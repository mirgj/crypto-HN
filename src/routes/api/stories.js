import { Router } from 'express';
import { asyncMiddleware } from '../../helpers/middlewares';
import * as storiesController from '../../controllers/stories-controller';

const router = Router();

router
.get('/:storyId', asyncMiddleware(async(req, res, next) =>
    res.json(await storiesController.getOneById(req.params.storyId))
));

export default router;
