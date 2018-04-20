import { MongoError } from 'mongodb';
import { logger } from '../helpers/logger';
import { ApiResult, WarningResult, InsertResult } from '../results/api-data';
import { ApiError, NotFoundError, BadRequestError } from '../results/api-errors';
import { Errors, Warnings, Infos } from '../constants/index';
import * as helper from '../helpers/common';
import * as manager from '../db/stories-manager';
import * as commentManager from '../db/comments-manager';

const getOneById = async(storyId) => {
  const story = await manager.findOne(storyId);
  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND);

  return new ApiResult(story);
};

const getStories = async(skip, take, show, ask) => {
  const result = await manager.getAll(skip, take, show, ask);
  if (!result) return new WarningResult(Warnings.NO_STORIES_WARNING);

  return new ApiResult(result);
};

const getStoriesChrono = async(skip, take, show, ask) => {
  const result = await manager.getAllChrono(skip, take, show, ask);
  if (!result) return new WarningResult(Warnings.NO_STORIES_WARNING);

  return new ApiResult(result);
};

const getComments = async(storyId, commentId) => {
  const comments = await commentManager.getAllByStory(storyId);
  if (!comments) return new WarningResult(Warnings.NO_COMMENTS_WARNING, []);

  let tree = helper.treefy(comments);
  if (commentId) {
    tree = helper.subtree(tree, commentId);
  }

  return new ApiResult(tree);
};

const create = async(userId, story) => {
  try {
    if (!story.text && !story.url) throw new BadRequestError(Errors.CREATE_STORY_INPUT_ERROR);

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

export {
  getOneById,
  getStories,
  getStoriesChrono,
  getComments,
  create,
};
