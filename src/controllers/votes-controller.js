import { WarningResult, OkResult } from '../results/api-data';
import { ApiError, NotFoundError } from '../results/api-errors';
import { Errors, Warnings, Infos, Commons, Collections } from '../constants/index';
import config from '../../config';
import * as manager from '../db/vote-log-manager';
import * as storiesManager from '../db/stories-manager';

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
};
