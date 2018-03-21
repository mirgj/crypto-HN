import Joi from 'joi';

const idMatch = Joi.string().regex(/^[0-9a-fA-F]{24}$/).required();

export default {
  getStory: {
    params: {
      storyId: idMatch,
    },
  },
};
