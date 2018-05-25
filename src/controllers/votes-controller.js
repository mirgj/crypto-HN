import { WarningResult, OkResult } from '../results/api-data';
import { ApiError, NotFoundError } from '../results/api-errors';
import { Errors, Warnings, Infos, Commons, Collections } from '../constants/index';
import config from '../../config';
import * as manager from '../db/vote-log-manager';
import * as storiesManager from '../db/stories-manager';
import * as usersManager from '../db/users-manager';
import * as commentsManager from '../db/comments-manager';
import * as helper from '../helpers/common';

const getUserVoteMapping = async(userId, data, objectType) => {
  const ids = helper.calculateMinAndMaxIds(data);
  if (!ids.min || !ids.max) return [];

  const res = await manager.findByUserAndIdsRange(userId, ids.min, ids.max, objectType);
  let result = [];

  res.forEach((el) => {
    result[el.object_id] = el;
  });

  return result;
};

const getUserStoriesVoteMapping = async(userId, stories) => {
  return await getUserVoteMapping(userId, stories, Collections.Stories);
};

const getUserCommentsVoteMapping = async(userId, comments) => {
  return await getUserVoteMapping(userId, comments, Collections.Comments);
};

const voteStory = async(userId, userKarma, storyId, direction) => {
  const story = await storiesManager.findOneStrict(storyId);
  const vote = await manager.findOneByUserIdObjectId(userId, storyId, Collections.Stories);
  const isUp = direction === Commons.Up;
  const voteIncrement = isUp ? 1 : -1;

  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND);
  if (story.user_id.toString() === userId.toString()) return new WarningResult(Warnings.CANT_VOTE_YOUR_STORY);

  if (vote)
    return new WarningResult(Warnings.ALREADY_VOTED_WARNING);
  if (userKarma < config.defaultValues.minKarmaForDownvote && !isUp)
    return new WarningResult(Warnings.NOT_ENOUGH_KARMA.split('{0}').join(config.defaultValues.minKarmaForDownvote));

  const updated = await storiesManager.incrementVote(storyId, voteIncrement);

  if (!updated.result.ok || !updated.modifiedCount) throw new ApiError(Errors.VOTE_ERROR);

  await usersManager.incrementVote(story.user_id, voteIncrement);
  await manager.create(userId, storyId, Collections.Stories, direction);
  return new OkResult(Infos.CREATE_VOTE_OK);
};

const unvoteStory = async(userId, storyId) => {
  const story = await storiesManager.findOneStrict(storyId);
  const vote = await manager.findOneByUserIdObjectId(userId, storyId, Collections.Stories);

  if (!vote) throw new NotFoundError(Errors.NOT_VOTE_FOUND_ERROR);
  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND);
  if (story.user_id.toString() === userId.toString()) return new WarningResult(Warnings.CANT_VOTE_YOUR_STORY);

  const voteIncrementRestore = vote.vote_direction === Commons.Up ? -1 : 1;
  const updated = await storiesManager.incrementVote(storyId, voteIncrementRestore);

  if (!updated.result.ok || !updated.modifiedCount) throw new ApiError(Errors.VOTE_ERROR);

  await usersManager.incrementVote(story.user_id, voteIncrementRestore);
  await manager.deleteOne(userId, storyId, Collections.Stories);
  return new OkResult(Infos.CREATE_UNVOTE_OK);
};

const voteComment = async(userId, userKarma, commentId, direction) => {
  const comment = await commentsManager.findOne(commentId);
  const vote = await manager.findOneByUserIdObjectId(userId, commentId, Collections.Comments);
  const isUp = direction === Commons.Up;
  const voteIncrement = isUp ? 1 : -1;

  if (!comment) return new NotFoundError(Errors.COMMENT_NOT_FOUND);
  if (comment.user_id.toString() === userId.toString()) return new WarningResult(Warnings.CANT_VOTE_YOURSELF);

  if (vote)
    return new WarningResult(Warnings.ALREADY_VOTED_WARNING);
  if (userKarma < config.defaultValues.minKarmaForDownvote && !isUp)
    return new WarningResult(Warnings.NOT_ENOUGH_KARMA.split('{0}').join(config.defaultValues.minKarmaForDownvote));

  const updated = await commentsManager.incrementVote(commentId, voteIncrement);

  if (!updated.result.ok || !updated.modifiedCount) throw new ApiError(Errors.VOTE_ERROR);

  await usersManager.incrementVote(comment.user_id, voteIncrement);
  await manager.create(userId, commentId, Collections.Comments, direction);
  return new OkResult(Infos.CREATE_VOTE_OK);
};

const unvoteComment = async(userId, commentId) => {
  const comment = await commentsManager.findOne(commentId);
  const vote = await manager.findOneByUserIdObjectId(userId, commentId, Collections.Comments);

  if (!vote) throw new NotFoundError(Errors.NOT_VOTE_FOUND_ERROR);
  if (!comment) return new NotFoundError(Errors.COMMENT_NOT_FOUND);
  if (comment.user_id.toString() === userId.toString()) return new WarningResult(Warnings.CANT_VOTE_YOURSELF);

  const voteIncrementRestore = vote.vote_direction === Commons.Up ? -1 : 1;
  const updated = await commentsManager.incrementVote(commentId, voteIncrementRestore);

  if (!updated.result.ok || !updated.modifiedCount) throw new ApiError(Errors.VOTE_ERROR);

  await usersManager.incrementVote(comment.user_id, voteIncrementRestore);
  await manager.deleteOne(userId, commentId, Collections.Comments);
  return new OkResult(Infos.CREATE_UNVOTE_OK);
};

export {
  voteStory,
  unvoteStory,
  voteComment,
  unvoteComment,
  getUserStoriesVoteMapping,
  getUserCommentsVoteMapping,
};
