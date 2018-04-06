import { Router } from 'express';
import { logger } from '../../helpers/logger';
import { NotFoundError } from '../../results/api-errors';
import validation from 'express-validation';
import usersRoutes from './users';

const router = Router();

router.use(usersRoutes);
router
  .get('/', (req, res, next) => {
    res.render('index', {
      title: 'Top News',
      user: req.user,
    });
  })
  .get('/404', (req, res) =>
    res.render('errors/404', {
      user: req.user,
      title: 'Page not found',
    })
  )
  .get('/500', (req, res) =>
    res.render('errors/500', {
      user: req.user,
      title: 'Internal error',
    })
  )
  .get('/*', (req, res) => {
    if (!res.headersSent)
      res.render('errors/404', {
        user: req.user,
        title: 'Page not found',
      });
  });

router.use((err, req, res, next) => {
  logger.error(`UI Error: ${err}`);

  if (err instanceof validation.ValidationError) {
    const messages = err.errors.map(error => error.messages.join('. '));
    req.flash('error', messages);
    const ref = req.header('Referer');

    return res.redirect(ref || req.path);
  }
  if (err instanceof NotFoundError) {
    return res.redirect('/404');
  }

  return res.redirect('/500');
});

export default router;
