import { WarningResult, OkResult } from '../results/api-data';
import { ApiError, NotFoundError } from '../results/api-errors';
import { Errors, Warnings, Infos, Commons, Collections } from '../constants/index';
import config from '../../config';
import * as manager from '../db/vote-log-manager';
import * as storiesManager from '../db/stories-manager';

const calculateMinAndMaxIds = (data) => {
  const defaultValue = data.length > 0 ? data[0]._id : null;
  let maxId = defaultValue;
  let minId = defaultValue;

  data.forEach((el) => {
    if (el._id.getTimestamp() < minId.getTimestamp())
      minId = el._id;

    if (el._id.getTimestamp() > maxId.getTimestamp())
      maxId = el._id;
  });

  return {
    min: minId,
    max: maxId,
  };
};

const getUserVoteMapping = async(userId, data, objectType) => {
  const ids = calculateMinAndMaxIds(data);
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

const getUserCommentsVoteMapping = async(userId, stories) => {
  return await getUserVoteMapping(userId, stories, Collections.Comments);
};

const voteStory = async(userId, userKarma, storyId, direction) => {
  const vote = await manager.findOneByUserIdObjectId(userId, storyId, Collections.Stories);
  const isUp = direction === Commons.Up;
  const voteIncrement = isUp ? 1 : -1;

  if (vote)
    return new WarningResult(Warnings.ALREADY_VOTED_WARNING);
  if (userKarma < config.defaultValues.minKarmaForDownvote && !isUp)
    return new WarningResult(Warnings.NOT_ENOUGH_KARMA.split('{0}').join(config.defaultValues.minKarmaForDownvote));

  const story = await storiesManager.incrementVote(storyId, voteIncrement);

  if (!story.result.ok || !story.modifiedCount) throw new ApiError(Errors.VOTE_ERROR);

  await manager.create(userId, storyId, Collections.Stories, direction);
  return new OkResult(Infos.CREATE_VOTE_OK);
};

const unvoteStory = async(userId, storyId) => {
  const vote = await manager.findOneByUserIdObjectId(userId, storyId, Collections.Stories);
  if (!vote) throw new NotFoundError(Errors.NOT_VOTE_FOUND_ERROR);

  const voteIncrementRestore = vote.vote_direction === Commons.Up ? -1 : 1;
  const story = await storiesManager.incrementVote(storyId, voteIncrementRestore);

  if (!story.result.ok || !story.modifiedCount) throw new ApiError(Errors.VOTE_ERROR);

  await manager.deleteOne(userId, storyId, Collections.Stories);
  return new OkResult(Infos.CREATE_UNVOTE_OK);
};

export {
  voteStory,
  unvoteStory,
  getUserStoriesVoteMapping,
  getUserCommentsVoteMapping,
};
