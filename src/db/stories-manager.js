import { ObjectID } from 'mongodb';
import { state as dbState } from './connector';
import { Collections } from '../constants/index';

const getStoryById = async(storyId) => {
  const storyCollection = dbState.defaultDbInstance.collection(Collections.Stories);

  return await storyCollection.findOne({ _id: ObjectID(storyId) });
};

export {
  getStoryById,
};
