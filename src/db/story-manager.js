import { ObjectID } from 'mongodb';
import { get as getDb } from 'connector';
import config from '../../config';

const postCollection = getDb(config.defaultDbName).collection('post');

const getStoryById = async(postId) => {
  return await postCollection.findOne({ _id: ObjectID(postId) });
};

export {
  getStoryById,
};
