import { Router } from 'express';

const router = Router();

router.use('/', (req, res, next) => {
  res.status(200).send('ok');

  return next();
});

export default router;
