import { ObjectID } from 'mongodb';
import { state as dbState } from './connector';
import { Collections } from '../constants/index';

const voteLogCollection = () => dbState.defaultDbInstance.collection(Collections.VoteLog);

const findOneByUserIdObjectId = async(userId, objectId, objectType) => {
  return await voteLogCollection().findOne({ user_id: ObjectID(userId), object_id: ObjectID(objectId), object_type: objectType });
};

const create = async(userId, objectId, objectType, direction) => {
  return await voteLogCollection().insertOne({
    user_id: ObjectID(userId),
    object_id: ObjectID(objectId),
    object_type: objectType,
    created_on: new Date(),
    vote_direction: direction,
  });
};

const deleteOne = async(userId, objectId, objectType) => {
  return await voteLogCollection().deleteOne({ user_id: ObjectID(userId), object_id: ObjectID(objectId), object_type: objectType });
};

export {
  findOneByUserIdObjectId,
  create,
  deleteOne,
};
