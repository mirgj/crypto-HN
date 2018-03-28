import Joi from 'joi';
import config from '../../config';

const idMatch = Joi.string().regex(/^[0-9a-fA-F]{24}$/).required();
const usernameMatch = Joi.string().alphanum().min(config.defaultValues.minUserLength).max(config.defaultValues.maxUserLength).required();
const passwordMatch = Joi.string().required().min(config.defaultValues.minPassLength);
const textMatch = Joi.string().required().allow('').max(config.defaultValues.maxTextLength);
const titleMatch = Joi.string().required().max(config.defaultValues.maxTitleLength);
const emailMatch = Joi.string().email().required();
const urlMatch = Joi.string().uri().trim().required().allow('');
const skipMatch = Joi.number().default(0).min(0);
const takeMatch = Joi.number().default(config.defaultValues.take).min(config.defaultValues.minTake);

export default {
  getStory: {
    params: {
      storyId: idMatch,
    },
  },
  getStories: {
    query: {
      skip: skipMatch,
      take: takeMatch,
    },
  },
  createStory: {
    body: {
      title: titleMatch,
      text: textMatch,
      url: urlMatch,
    },
  },
  getUser: {
    params: {
      userId: idMatch,
    },
  },
  updateUser: {
    body: {
      about: textMatch,
      email: emailMatch,
    },
    params: {
      userId: idMatch,
    },
  },
  createUserOrLogin: {
    body: {
      username: usernameMatch,
      password: passwordMatch,
    },
  },
  createComment: {
    params: {
      storyId: idMatch,
    },
    body: {
      text: textMatch,
    },
  },
};
