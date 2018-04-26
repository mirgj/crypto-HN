import { ApiResult, InsertResult, WarningResult, OkResult } from '../results/api-data';
import { ApiError, NotFoundError, ForbiddenError } from '../results/api-errors';
import { Errors, Infos, Warnings } from '../constants/index';
import * as manager from '../db/comments-manager';
import * as storyManager from '../db/stories-manager';

const getAllComments = async(skip, take, userId) => {
  const result = await manager.getAllChrono(skip, take, userId);
  if (!result) return new WarningResult(Warnings.NO_COMMENTS_WARNING_ALL);

  return new ApiResult(result);
};

const createForStory = async(userId, storyId, text, parentCommentId) => {
  const story = await storyManager.findOne(storyId);
  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND);

  const ncomment = await manager.create(userId, storyId, text, parentCommentId);
  if (!ncomment.result.ok || ncomment.insertedCount === 0) throw new ApiError(Errors.CREATE_COMMENT_ERROR);

  return new InsertResult(Infos.CREATE_COMMENT_INFO, ncomment.insertedId);
};

const update = async(userId, commentId, text, deleted) => {
  const comment = await manager.findOne(commentId);
  if (comment.user_id.toString() !== userId.toString())
    throw new ForbiddenError(deleted ? Errors.FORBIDDEN_DELETE_COMMENT_ERROR : Errors.FORBIDDEN_UPDATE_COMMENT_ERROR);

  const res = await manager.update(commentId, text, deleted);
  if (!res.result.ok)
    throw new ApiError(deleted ? Errors.DELETE_COMMENT_ERROR : Errors.UPDATE_COMMENT_ERROR);

  return new OkResult(deleted ? Infos.UPDATE_COMMENT_INFO : Infos.DELETE_COMMENT_INFO);
};

export {
  getAllComments,
  createForStory,
  update,
};
