import { MongoClient } from 'mongodb';
import { logger } from '../helpers/logger';
import * as errors from '../constants/errors';

const state = {
  instance: null,
  defaultDbInstance: null,
};

const connect = async(url) => {
  if (state.instance) return state.instance;
  state.instance = await MongoClient.connect(url);
  logger.log('verbose', 'Connected to the database');
};

const get = (dbName) => {
  if (!state.instance) throw new Error(errors.DB_ERROR);
  if (!state.defaultDbInstance) state.defaultDbInstance = state.instance.db(dbName);

  return state.defaultDbInstance;
};

const initDefaultDb = async(dbName) => {
  if (!state.instance) throw new Error(errors.DB_ERROR);
  const dbo = get(dbName);

  await dbo.createCollection('users', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: [ 'username', 'password' ],
        properties: {
          username: {
            bsonType: 'string',
            description: 'Username must be a string and is required',
          },
          password: {
            bsonType: 'string',
            description: 'Password must be a string and is required',
          },
          email: {
            bsonType: 'string',
            description: 'Email must be a string and is not required',
          },
          karma: {
            bsonType: 'int',
            description: 'karma gained',
          },
          about: {
            bsonType: 'string',
            description: 'information about the user',
          },
          created_on: {
            bsonType: 'date',
            description: 'Creation date',
          },
          updated_on: {
            bsonType: 'date',
            description: 'Update date',
          },
        },
      },
    },
  });
  await dbo.createCollection('posts', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: [ 'user_id', 'title' ],
        properties: {
          user_id: {
            bsonType: 'objectId',
            description: 'user_id must be a ObjectId and is required',
          },
          title: {
            bsonType: 'string',
            description: 'title must be a string and is required',
          },
          text: {
            bsonType: 'string',
            description: 'text of the post',
          },
          url: {
            bsonType: 'string',
            description: 'url of the post',
          },
          score: {
            bsonType: 'int',
            description: 'post score',
          },
          creation_time: {
            bsonType: 'timestamp',
            description: 'timestamp of the post',
          },
          comments: {
            bsonType: 'array',
            description: 'comment array ids',
          },
        },
      },
    },
  });

  logger.log('verbose', 'database initialization done!');
};

const close = async() => {
  if (state.instance) {
    await state.instance.close();
    state.instance = null;
    logger.log('verbose', 'db connection closed');

    return true;
  }

  return false;
};

export {
  connect,
  get,
  initDefaultDb,
  close,
};
