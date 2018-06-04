import Joi from 'joi';
import config from '../../config';
import { Commons } from '../constants/index';

const idMatch = Joi.string().regex(/^[0-9a-fA-F]{24}$/).required();
const usernameMatch = Joi.string().alphanum().min(config.defaultValues.minUserLength).max(config.defaultValues.maxUserLength).required();
const passwordMatch = Joi.string().required().min(config.defaultValues.minPassLength);
const textMatch = Joi.string().required().max(config.defaultValues.maxTextLength);
const titleMatch = Joi.string().required().max(config.defaultValues.maxTitleLength);
const emailMatch = Joi.string().email().required();
const urlMatch = Joi.string().uri().trim().required().allow('');
const skipMatch = Joi.number().default(0).min(0);
const takeMatch = Joi.number().default(config.defaultValues.take).min(config.defaultValues.minTake);
const voteDirectionMatch = Joi.any().required().valid([Commons.Up, Commons.Down]);

export default {
  getStory: {
    params: {
      storyId: idMatch,
      commentId: idMatch.optional(),
    },
  },
  getComment: {
    params: {
      commentId: idMatch,
    },
  },
  getStories: {
    query: {
      skip: skipMatch,
      take: takeMatch,
    },
  },
  getComments: {
    query: {
      skip: skipMatch,
      take: takeMatch,
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
  getUser: {
    params: {
      userId: idMatch,
    },
  },
  updateUser: {
    options: {
      allowUnknownBody: false,
    },
    body: {
      about: textMatch.allow(''),
      email: emailMatch,
    },
    params: {
      userId: idMatch,
    },
  },
  createUserOrLogin: {
    options: {
      allowUnknownBody: false,
    },
    body: {
      username: usernameMatch,
      password: passwordMatch,
    },
  },
  createComment: {
    options: {
      allowUnknownBody: false,
    },
    params: {
      storyId: idMatch,
      commentId: idMatch.optional(),
    },
    body: {
      text: textMatch,
    },
  },
  voteStory: {
    options: {
      allowUnknownBody: false,
    },
    params: {
      storyId: idMatch,
    },
    body: {
      direction: voteDirectionMatch,
    },
  },
  voteComment: {
    options: {
      allowUnknownBody: false,
    },
    params: {
      commentId: idMatch,
    },
    body: {
      direction: voteDirectionMatch,
    },
  },
};
