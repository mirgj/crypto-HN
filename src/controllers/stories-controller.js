import { MongoError } from 'mongodb';
import { logger } from '../helpers/logger';
import { ApiResult, InsertResult } from '../results/api-data';
import { ApiError, NotFoundError } from '../results/api-errors';
import { Errors, Infos } from '../constants/index';
import * as manager from '../db/stories-manager';

const getOneById = async(storyId) => {
  const story = await manager.findOne(storyId);
  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND);

  return new ApiResult(story);
};

const create = async(userId, story) => {
  try {
    const nstory = manager.create(userId, story.title, story.text, story.url);
    if (!nstory.result.ok || nstory.insertedCount === 0) throw new ApiError(Errors.CREATE_STORY_ERROR);

    return new InsertResult(Infos.CREATE_STORY_INFO, nstory.insertedId);
  } catch (err) {
    if (err instanceof MongoError) {
      logger.error(`Error creating story: ${err}`);

      throw new ApiError(Errors.CREATE_STORY_ERROR);
    }
  }
};

export {
  getOneById,
  create,
};
