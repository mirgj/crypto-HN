import { Router } from 'express';
import { passport } from '../../helpers/authenticator';
import { isAuthenticatedMiddleware, notAuthenticatedMiddleware, asyncMiddleware } from '../../helpers/middlewares';
import { ApiError, NotFoundError } from '../../results/api-errors';
import { UI } from '../../constants/index';
import validation from 'express-validation';
import viewValidators from '../../validation/view-validator';
import config from '../../../config.json';
import * as commentsController from '../../controllers/comments-controller';
import * as storiesController from '../../controllers/stories-controller';
import * as usersController from '../../controllers/users-controller';
import * as commonHelper from './common-helper';

const router = Router();
const auth = passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true });

router
  .get('/login', notAuthenticatedMiddleware('/'), (req, res, next) => {
    res.render('login', {
      title: UI.Titles.LoginPage,
      current_element: 'login',
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
        req.flash('info', UI.Messages.UserCreated)
        : req.flash('error', UI.Errors.UserCreationError);

      res.redirect('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        req.flash('error', [err.result.description]);
        return res.redirect('/login');
      }

      return next();
    }
  }))
  .get('/user/:username', validation(viewValidators.getUser), asyncMiddleware(async(req, res, next) => {
    const cres = await usersController.getLogin(req.params.username);
    const user = !cres.error && cres.result.success ? cres.result.data : null;
    const isMe = user && req.user && req.user.username === user.username;
    const title = isMe ? UI.Titles.MyProfileTitle : user.username + UI.Titles.ProfileTitle;

    res.render('profile', {
      title: title,
      user: req.user,
      profileUser: user,
      isMe: isMe,
      current_element: isMe ? 'profile' : '',
      errors: req.flash('error'),
      info: req.flash('info'),
    });
  }))
  .get('/user/:username/submissions', validation(viewValidators.getUser), asyncMiddleware(async(req, res, next) => {
    const cres = await usersController.getLogin(req.params.username);
    const user = !cres.error && cres.result.success ? cres.result.data : null;
    const userId = user ? user._id : null;
    const currentPage = req.query.page;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const stories = await storiesController.getStories(skip, config.defaultValues.take, null, null, userId);

    await commonHelper.commonStoriesRoute(req, res, next, stories, user.username + UI.Titles.UserSubmissions, 'submissions');
  }))
  .get('/user/:username/comments', validation(viewValidators.getUser), asyncMiddleware(async(req, res, next) => {
    const cres = await usersController.getLogin(req.params.username);
    const currentPage = req.query.page;
    const user = !cres.error && cres.result.success ? cres.result.data : null;
    const userId = user ? user._id : null;
    const skip = (currentPage - 1) * config.defaultValues.take;
    const comments = await commentsController.getAllComments(skip, config.defaultValues.take, userId);

    await commonHelper.commonComments(req, res, next, comments, user.username + UI.Titles.UserComments, 'usercomments');
  }))
  .post('/user/:username',
    isAuthenticatedMiddleware('/login'),
    validation(viewValidators.updateUser),
    asyncMiddleware(async(req, res, next) => {
      if (req.user.username !== req.params.username) {
        req.flash('error', [UI.Errors.OperationNotAllowed]);

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
