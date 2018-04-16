import { ApiResult, InsertResult, WarningResult } from '../results/api-data';
import { ApiError, NotFoundError } from '../results/api-errors';
import { Errors, Infos, Warnings } from '../constants/index';
import * as manager from '../db/comments-manager';
import * as storyManager from '../db/stories-manager';

const getAllComments = async(skip, take) => {
  const result = await manager.getAllChrono(skip, take);
  if (!result) return new WarningResult(Warnings.NO_COMMENTS_WARNING_ALL);

  return new ApiResult(result);
};

const createForStory = async(userId, storyId, text) => {
  const story = await storyManager.findOne(storyId);
  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND);

  const ncomment = await manager.create(userId, storyId, text);
  if (!ncomment.result.ok || ncomment.insertedCount === 0) throw new ApiError(Errors.CREATE_COMMENT_ERROR);

  return new InsertResult(Infos.CREATE_COMMENT_INFO, ncomment.insertedId);
};

export {
  getAllComments,
  createForStory,
};
