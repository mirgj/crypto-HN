import Joi from 'joi';
import config from '../../config';
import { Commons } from '../constants/index';

export default {
  idMatch: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  usernameMatch: Joi.string().alphanum().min(config.defaultValues.minUserLength).max(config.defaultValues.maxUserLength).required(),
  passwordMatch: Joi.string().required().min(config.defaultValues.minPassLength),
  textMatch: Joi.string().required().allow('').max(config.defaultValues.maxTextLength),
  titleMatch: Joi.string().required().max(config.defaultValues.maxTitleLength),
  emailMatch: Joi.string().email().required(),
  urlMatch: Joi.string().uri().trim().required().allow(''),
  skipMatch: Joi.number().default(0).min(0),
  takeMatch: Joi.number().default(config.defaultValues.take).min(config.defaultValues.minTake),
  voteDirectionMatch: Joi.any().valid([Commons.Up, Commons.Down]),
};
