import { ApiResult } from '../results/api-data';
import { NotFoundError } from '../results/api-errors';
import { Errors, HttpStatus } from '../constants/index';
import * as manager from '../db/stories-manager';

const getOneById = async(storyId) => {
  const story = await manager.getStoryById(storyId);
  if (!story) throw new NotFoundError(Errors.STORY_NOT_FOUND, HttpStatus.NOT_FOUND);

  return new ApiResult(story);
};

export {
  getOneById,
};
