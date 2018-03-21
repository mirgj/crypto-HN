import { Router } from 'express';
import storiesRoutes from './stories';

const router = Router();

router.use('/stories', storiesRoutes);
router.use('/', (req, res, next) =>
  res.status(200).send('ok')
);

export default router;
