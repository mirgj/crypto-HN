import { Router } from 'express';

const router = Router();

router.get('/', (req, res, next) =>
  res.render('index')
);
router.get('/login', (req, res, next) =>
  res.render('login')
);

export default router;
