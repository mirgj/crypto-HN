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
        karma: 1,
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
  ]);
  const arr = result.toArray();

  if (!arr || arr.length === 0) return null;

  return arr[0];
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
        karma: 1,
        created_on: 1,
        timestamp_karma: { $add: [ '$created_on', { $multiply: ['$karma', config.defaultValues.karmaIncrementMill ] } ] },
        comment_count: { $size: '$comments' },
      },
    },
    { $sort: { timestamp_karma: -1 } },
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

  return result;
};

const create = async(userId, title, text, url) => {
  return await storyCollection().insertOne({
    user_id: ObjectID(userId),
    title: title,
    text: text,
    url: url,
    karma: 1,
    created_on: new Date(),
  });
};

export {
  findOne,
  getAll,
  create,
};
