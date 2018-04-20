import Joi from 'joi';
import config from '../../config';
// import { Commons } from '../constants/index';

const idMatchStrict = Joi.string().regex(/^[0-9a-fA-F]{24}$/);
const idMatch = Joi.string().required();
const usernameMatch = Joi.string().alphanum().min(config.defaultValues.minUserLength).max(config.defaultValues.maxUserLength).required();
const passwordMatch = Joi.string().required().min(config.defaultValues.minPassLength);
const titleMatch = Joi.string().required().max(config.defaultValues.maxTitleLength);
const textMatch = Joi.string().required().max(config.defaultValues.maxTextLength);
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
      about: textMatch.allow(''),
      email: emailMatch.allow(''),
    },
    params: {
      username: usernameMatch,
    },
  },
  getUser: {
    params: {
      username: usernameMatch,
    },
    query: {
      page: pageMatch,
    },
  },
  getStories: {
    query: {
      page: pageMatch,
    },
  },
  getComments: {
    query: {
      page: pageMatch,
    },
  },
  getComment: {
    options: {
      allowUnknownParams: false,
    },
    params: {
      commentId: idMatch,
    },
  },
  createComment: {
    options: {
      allowUnknownBody: false,
    },
    body: {
      text: textMatch,
      commentId: idMatchStrict.optional(),
    },
    params: {
      storyId: idMatch,
    },
  },
  getStory: {
    options: {
      allowUnknownParams: false,
    },
    params: {
      storyId: idMatch,
    },
  },
  getStoryComment: {
    options: {
      allowUnknownParams: false,
    },
    params: {
      storyId: idMatch,
      commentId: idMatch,
    },
  },
  createStory: {
    options: {
      allowUnknownBody: false,
    },
    body: {
      title: titleMatch,
      text: textMatch.allow(''),
      url: urlMatch,
    },
  },
};
