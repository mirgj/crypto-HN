import { MongoError } from 'mongodb';
import { logger } from '../helpers/logger';
import { ApiResult, InsertResult, OkResult } from '../results/api-data';
import { ApiError, NotFoundError } from '../results/api-errors';
import { Errors, Infos } from '../constants/index';
import * as manager from '../db/users-manager';
import * as hashHelper from '../helpers/hasher';

const getByUsername = async(username) => {
  const user = await manager.findLogin(username);
  if (!user) throw new NotFoundError(Errors.USERNAME_NOT_FOUND);

  return new ApiResult(user);
};

const get = async(userId) => {
  const user = await manager.findOne(userId);
  if (!user) throw new NotFoundError(Errors.USER_NOT_FOUND);

  return new ApiResult(user);
};

const create = async(user) => {
  try {
    user.password = await hashHelper.generateHash(user.password);
    const nuser = await manager.create(user.username, user.password);

    if (!nuser.result.ok || nuser.insertedCount === 0) throw new ApiError(Errors.CREATE_USER_ERROR);

    return new InsertResult(Infos.CREATE_USER_INFO, nuser.insertedId);
  } catch (err) {
    if (err instanceof MongoError) {
      logger.error(`Error creating a user: ${err}`);

      throw new ApiError(Errors.CREATE_USER_USERNAME_ERROR);
    }
  }
};

const update = async(userId, email, about) => {
  const user = await manager.update(userId, email, about);

  if (user.result.n === 0) throw new NotFoundError(Errors.USER_NOT_FOUND);
  if (!user.result.ok) throw new ApiError(Errors.UPDATE_USER_ERROR);

  return new OkResult(Infos.UPDATE_USER_INFO);
};

export {
  getByUsername,
  get,
  create,
  update,
};
