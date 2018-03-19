import { Router } from 'express';

const router = Router();

router.use('/', (req, res, next) =>
  res.render('index')
);

export default router;
