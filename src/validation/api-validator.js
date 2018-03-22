import Joi from 'joi';

const idMatch = Joi.string().regex(/^[0-9a-fA-F]{24}$/).required();
const usernameMatch = Joi.string().alphanum().min(3).max(30).required();
const passwordMatch = Joi.string().required().min(5);
const aboutMatch = Joi.string().required().allow('').max(400);
const emailMatch = Joi.string().email().required();

export default {
  getStory: {
    params: {
      storyId: idMatch,
    },
  },
  getUser: {
    params: {
      userId: idMatch,
    },
  },
  updateUser: {
    body: {
      about: aboutMatch,
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
};
