import { MongoError } from 'mongodb';
import { logger } from '../helpers/logger';
import { ApiResult, WarningResult, InsertResult, OkResult } from '../results/api-data';
import { ApiError, NotFoundError, BadRequestError, ForbiddenError } from '../results/api-errors';
import { Errors, Warnings, Infos } from '../constants/index';
import * as manager from '../db/stories-manager';

const getOneById = async(storyId) => {
  const story = await manager.findOne(storyId);
  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND);

  return new ApiResult(story);
};

const getStories = async(skip, take, show, ask, userId) => {
  const result = await manager.getAll(skip, take, show, ask, userId);
  if (!result) return new WarningResult(Warnings.NO_STORIES_WARNING);

  return new ApiResult(result);
};

const getStoriesChrono = async(skip, take, show, ask, userId) => {
  const result = await manager.getAllChrono(skip, take, show, ask, userId);
  if (!result) return new WarningResult(Warnings.NO_STORIES_WARNING);

  return new ApiResult(result);
};

const create = async(userId, story) => {
  try {
    if (!story.text && !story.url) throw new BadRequestError(Errors.CREATE_STORY_INPUT_ERROR);

    const nstory = await manager.create(userId, story.title, story.text, story.url);
    if (!nstory.result.ok || nstory.insertedCount === 0) throw new ApiError(Errors.CREATE_STORY_ERROR);

    return new InsertResult(Infos.CREATE_STORY_INFO, nstory.insertedId);
  } catch (err) {
    if (err instanceof MongoError) {
      logger.warn(`Error creating story: ${err}`);

      throw new ApiError(Errors.CREATE_STORY_ERROR);
    }

    throw err;
  }
};

const deleteStory = async(userId, storyId) => {
  const story = await manager.findOneStrict(storyId);
  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND);
  if (story.user_id.toString() !== userId.toString()) throw new ForbiddenError(Errors.FORBIDDEN_DELETE_STORY_ERROR);

  const nstory = await manager.deleteOne(storyId);
  if (!nstory.result.ok || nstory.deletedCount === 0) throw new ApiError(Errors.DELETE_STORY_ERROR);

  return new OkResult(Infos.DELETE_STORY_INFO);
};

export {
  getOneById,
  getStories,
  getStoriesChrono,
  create,
  deleteStory,
};
