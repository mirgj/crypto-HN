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

const findByUserAndIdsRange = async(userId, minId, maxId, objectType) => {
  return await voteLogCollection().find({
    user_id: ObjectID(userId),
    object_id: { $gte: ObjectID(minId), $lte: ObjectID(maxId) },
    object_type: objectType,
  }).toArray();
};

export {
  findOneByUserIdObjectId,
  create,
  deleteOne,
  findByUserAndIdsRange,
};
