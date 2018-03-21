import { ObjectID } from 'mongodb';
import { state as dbState } from './connector';
import { Collections } from '../constants/index';

const storyCollection = () => dbState.defaultDbInstance.collection(Collections.Stories);

const getStoryById = async(storyId) => {
  return await storyCollection().findOne({ _id: ObjectID(storyId) });
};

export {
  getStoryById,
};
