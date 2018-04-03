import { Router } from 'express';
import { passport } from '../../helpers/authenticator';
import { isAuthenticatedMiddleware } from '../../helpers/middlewares';

const router = Router();
const auth = passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true });

router
  .get('/', (req, res, next) => {
    res.render('index', {
      title: 'Top News',
      user: req.user,
    });
  })
  .get('/login', (req, res, next) => {
    res.render('login', {
      signInUpError: req.flash('error'),
      signupInfo: req.flash('signupInfo'),
    });
  })
  .get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  })
  .post('/login', auth)
  .post('/register', (req, res, next) =>
    res.render('login')
  )
  .get('/profile', isAuthenticatedMiddleware('/login'), (req, res, next) =>
    res.render('profile')
  );

export default router;
