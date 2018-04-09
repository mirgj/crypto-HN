import Joi from 'joi';
import config from '../../config';
// import { Commons } from '../constants/index';

const usernameMatch = Joi.string().alphanum().min(config.defaultValues.minUserLength).max(config.defaultValues.maxUserLength).required();
const passwordMatch = Joi.string().required().min(config.defaultValues.minPassLength);
const textMatch = Joi.string().required().allow('').max(config.defaultValues.maxTextLength);
const emailMatch = Joi.string().email().required();
const pageMatch = Joi.number().default(1).min(1);

export default {
  createUserOrLogin: {
    body: {
      username: usernameMatch,
      password: passwordMatch,
    },
  },
  updateUser: {
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
};
