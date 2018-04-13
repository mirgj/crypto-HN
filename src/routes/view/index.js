import { Router } from 'express';
import { logger } from '../../helpers/logger';
import { NotFoundError } from '../../results/api-errors';
import validation from 'express-validation';
import usersRoutes from './users';
import storiesRoutes from './stories';
import commentsRoutes from './comments';

const router = Router();

router.use(usersRoutes);
router.use(storiesRoutes);
router.use(commentsRoutes);
router
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
  logger.error(`UI Error: ${JSON.stringify(err)}`);

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
