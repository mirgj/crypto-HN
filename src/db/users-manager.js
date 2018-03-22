import { ObjectID } from 'mongodb';
import { state as dbState } from './connector';
import { Collections } from '../constants/index';

const userCollection = () => dbState.defaultDbInstance.collection(Collections.Users);

const findOneByUsername = async(username) => {
  return await userCollection().findOne({ username: username });
};

const findOne = async(userId) => {
  return await userCollection().findOne({ _id: ObjectID(userId) }, { fields: { password: 0 } });
};

const create = async(username, hashedPassword) => {
  return await userCollection().insertOne({
    username: username,
    password: hashedPassword,
    created_on: new Date(),
    karma: 1,
  });
};

const update = async(userId, email, about) => {
  var obj = {
    updated_on: new Date(),
  };
  if (email) obj.email = email;
  if (about) obj.about = about;

  return await userCollection().updateOne(
    { _id: ObjectID(userId) },
    { $set: obj }
  );
};

export {
  findOneByUsername,
  findOne,
  create,
  update,
};
