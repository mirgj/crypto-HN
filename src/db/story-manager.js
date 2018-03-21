import { ObjectID } from 'mongodb';
import { get as getDb } from 'connector';
import { Collections } from '../constants/index';
import config from '../../config';

const storyCollection = getDb(config.defaultDbName).collection(Collections.Stories);

const getStoryById = async(storyId) => {
  return await storyCollection.findOne({ _id: ObjectID(storyId) });
};

export {
  getStoryById,
};
