import { ObjectID } from 'mongodb';
import { state as dbState } from './connector';
import { Collections } from '../constants/index';
import config from '../../config';

const storyCollection = () => dbState.defaultDbInstance.collection(Collections.Stories);

const findOne = async(storyId) => {
  const result = await storyCollection().aggregate([
    { $match: { _id: ObjectID(storyId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'story_id',
        as: 'comments_temp',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        'user._id': 1,
        'user.username': 1,
        title: 1,
        text: 1,
        url: 1,
        score: 1,
        created_on: 1,
        comments: {
          $map: {
            input: '$comments_temp',
            as: 'comment',
            in: '$$comment._id',
          },
        },
      },
    },
  ]).toArray();

  if (!result || result.length === 0) return null;

  return result[0];
};

const getAll = async(skip, take) => {
  const result = await storyCollection().aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'story_id',
        as: 'comments',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        'user._id': 1,
        'user.username': 1,
        title: 1,
        text: 1,
        url: 1,
        score: 1,
        created_on: 1,
        timestamp_score: { $add: [ '$created_on', { $multiply: ['$score', config.defaultValues.scoreIncrementMill ] } ] },
        comment_count: { $size: '$comments' },
      },
    },
    { $sort: { timestamp_score: -1 } },
    {
      $facet: {
        page_info: [ { $count: 'total_count' } ],
        stories: [ { $skip: skip }, { $limit: take } ],
      },
    },
    { $unwind: '$page_info' },
    {
      $project: {
        stories_count: '$page_info.total_count',
        stories: 1,
      },
    },
  ]).toArray();

  if (!result || result.length === 0) return null;

  return result[0];
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
  getAll,
};
