import { ObjectID } from 'mongodb';
import { state as dbState } from './connector';
import { Collections } from '../constants/index';

const storyCollection = () => dbState.defaultDbInstance.collection(Collections.Stories);

const findOne = async(storyId) => {
  return await storyCollection().findOne({ _id: ObjectID(storyId) });
};

const create = async(userId, title, text, url) => {
  return await storyCollection().insertOne({
    user_id: ObjectID(userId),
    title: title,
    text: text,
    url: url,
    score: 1,
    created_on: new Date(),
  });
};

export {
  findOne,
  create,
};
