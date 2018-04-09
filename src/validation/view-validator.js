import Joi from 'joi';
import config from '../../config';
// import { Commons } from '../constants/index';

const usernameMatch = Joi.string().alphanum().min(config.defaultValues.minUserLength).max(config.defaultValues.maxUserLength).required();
const passwordMatch = Joi.string().required().min(config.defaultValues.minPassLength);
const titleMatch = Joi.string().required().max(config.defaultValues.maxTitleLength);
const textMatch = Joi.string().required().max(config.defaultValues.maxTextLength).allow('');
const urlMatch = Joi.string().uri().trim().required().allow('');
const emailMatch = Joi.string().email().required();
const pageMatch = Joi.number().default(1).min(1);

export default {
  createUserOrLogin: {
    options: {
      allowUnknownBody: false,
    },
    body: {
      username: usernameMatch,
      password: passwordMatch,
    },
  },
  updateUser: {
    options: {
      allowUnknownBody: false,
    },
    body: {
      about: textMatch,
      email: emailMatch.allow(''),
    },
    params: {
      username: usernameMatch,
    },
  },
  getTopNews: {
    query: {
      page: pageMatch,
    },
  },
  createStory: {
    options: {
      allowUnknownBody: false,
    },
    body: {
      title: titleMatch,
      text: textMatch,
      url: urlMatch,
    },
  },
};
