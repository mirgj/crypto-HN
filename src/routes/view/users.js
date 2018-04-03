import { Router } from 'express';
import { passport } from '../../helpers/authenticator';
import { isAuthenticatedMiddleware } from '../../helpers/middlewares';
import { ApiError } from '../../results/api-errors';
import validation from 'express-validation';
import viewValidators from '../../validation/view-validator';
import * as usersController from '../../controllers/users-controller';

const router = Router();
const auth = passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true });

router
  .get('/login', (req, res, next) => {
    res.render('login', {
      title: 'Login or Register',
      errors: req.flash('error'),
      info: req.flash('info'),
    });
  })
  .get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  })
  .post('/login', validation(viewValidators.createUserOrLogin), auth)
  .post('/register', validation(viewValidators.createUserOrLogin), async(req, res, next) => {
    try {
      var user = await usersController.create(req.body.username, req.body.password);

      !user.error && user.result.success ?
        req.flash('info', 'User has been created. Use your credentials to login')
        : req.flash('error', 'Error creating the user');

      res.redirect('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        req.flash('error', [err.result.description]);
        return res.redirect('/login');
      }

      return next();
    }
  })
  .get('/profile', isAuthenticatedMiddleware('/login'), (req, res, next) =>
    res.render('profile')
  );

export default router;
