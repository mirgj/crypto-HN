import { MongoError } from 'mongodb';
import { logger } from '../helpers/logger';
import { ApiResult, WarningResult, InsertResult } from '../results/api-data';
import { ApiError, NotFoundError } from '../results/api-errors';
import { Errors, Warnings, Infos } from '../constants/index';
import * as manager from '../db/stories-manager';
import * as commentManager from '../db/comments-manager';

const getOneById = async(storyId) => {
  const story = await manager.findOne(storyId);
  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND);

  return new ApiResult(story);
};

const getStories = async(skip, take) => {
  const result = await manager.getAll(skip, take);
  if (!result) return new WarningResult(Warnings.NO_STORIES_WARNING);

  return new ApiResult(result);
};

const getComments = async(storyId) => {
  const comments = await commentManager.getAllByStory(storyId);
  if (!comments) return new WarningResult(Warnings.NO_COMMENTS_WARNING, []);

  return new ApiResult(comments);
};

const create = async(userId, story) => {
  try {
    const nstory = await manager.create(userId, story.title, story.text, story.url);
    if (!nstory.result.ok || nstory.insertedCount === 0) throw new ApiError(Errors.CREATE_STORY_ERROR);

    return new InsertResult(Infos.CREATE_STORY_INFO, nstory.insertedId);
  } catch (err) {
    if (err instanceof MongoError) {
      logger.error(`Error creating story: ${err}`);

      throw new ApiError(Errors.CREATE_STORY_ERROR);
    }

    throw err;
  }
};

const createComment = async(userId, storyId, text) => {
  const story = await manager.findOne(storyId);
  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND);

  const ncomment = await commentManager.create(userId, storyId, text);
  if (!ncomment.result.ok || ncomment.insertedCount === 0) throw new ApiError(Errors.CREATE_COMMENT_ERROR);

  return new InsertResult(Infos.CREATE_COMMENT_INFO, ncomment.insertedId);
};

export {
  getOneById,
  getStories,
  getComments,
  create,
  createComment,
};
