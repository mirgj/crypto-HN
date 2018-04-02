import { ObjectID } from 'mongodb';
import { state as dbState } from './connector';
import { Collections } from '../constants/index';

const voteLogCollection = () => dbState.defaultDbInstance.collection(Collections.VoteLog);

const findOneByUserIdObjectId = async(userId, objectId) => {
  return await voteLogCollection().findOne({ user_id: ObjectID(userId), object_id: ObjectID(objectId) });
};

const create = async(userId, objectId, direction) => {
  return await voteLogCollection().insertOne({
    user_id: ObjectID(userId),
    object_id: ObjectID(objectId),
    created_on: new Date(),
    vote_direction: direction,
  });
};

const deleteOne = async(userId, objectId) => {
  return await voteLogCollection().deleteOne({ user_id: ObjectID(userId), object_id: ObjectID(objectId) });
};

export {
  findOneByUserIdObjectId,
  create,
  deleteOne,
};
