import { Router } from 'express';
import { passport } from '../../helpers/authenticator';
import { isAuthenticatedMiddleware, notAuthenticatedMiddleware, asyncMiddleware } from '../../helpers/middlewares';
import { ApiError, NotFoundError } from '../../results/api-errors';
import validation from 'express-validation';
import viewValidators from '../../validation/view-validator';
import * as usersController from '../../controllers/users-controller';

const router = Router();
const auth = passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true });

router
  .get('/login', notAuthenticatedMiddleware('/'), (req, res, next) => {
    res.render('login', {
      title: 'Login or Register',
      currentElement: 'login',
      errors: req.flash('error'),
      info: req.flash('info'),
    });
  })
  .get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  })
  .post('/login', validation(viewValidators.createUserOrLogin), auth)
  .post('/register', validation(viewValidators.createUserOrLogin), asyncMiddleware(async(req, res, next) => {
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
  }))
  .get('/user/:username', asyncMiddleware(async(req, res, next) => {
    let user = null;

    try {
      const cres = await usersController.getLogin(req.params.username);
      user = !cres.error && cres.result.success ? cres.result.data : null;
    } catch (err) {
      if (err instanceof NotFoundError) {
        req.flash('error', [err.result.description]);
      }
    }
    const isMe = user && req.user && req.user.username === user.username;

    res.render('profile', {
      title: 'Your profile',
      user: req.user,
      profileUser: user,
      isMe: isMe,
      currentElement: isMe ? 'profile' : '',
      errors: req.flash('error'),
      info: req.flash('info'),
    });
  }))
  .post('/user/:username',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.updateUser),
    asyncMiddleware(async(req, res, next) => {
      if (req.user.username !== req.params.username) {
        req.flash('error', ['Operation not allowed']);

        return res.redirect(req.url);
      }

      try {
        const cres = await usersController.update(req.user._id, req.body.email, req.body.about);
        const message = !cres.error && cres.result.success ? cres.result.data.description : null;

        req.flash('info', message);
      } catch (err) {
        if (err instanceof NotFoundError || err instanceof ApiError) {
          req.flash('error', [err.result.description]);
        }
      }

      res.redirect(req.url);
    }));

export default router;
