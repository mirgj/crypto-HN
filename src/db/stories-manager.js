import { ObjectID } from 'mongodb';
import { state as dbState } from './connector';
import { Collections } from '../constants/index';
import config from '../../config';
import * as helper from '../helpers/common';

const storyCollection = () => dbState.defaultDbInstance.collection(Collections.Stories);

const findOneStrict = async(storyId) => {
  return await storyCollection().findOne({ _id: ObjectID(storyId) });
};
const findOne = async(storyId) => {
  const aggregation = [
    { $match: { _id: ObjectID(storyId) } },
    {
      $lookup: {
        from: Collections.Users,
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $lookup: {
        from: Collections.Comments,
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
        base_url: 1,
        karma: 1,
        created_on: 1,
        comments: {
          $map: {
            input: '$comments_temp',
            as: 'comment',
            in: '$$comment._id',
          },
        },
        comment_count: { $size: '$comments_temp' },
      },
    },
  ];
  const result = await storyCollection().aggregate(aggregation).toArray();

  if (!result || result.length === 0) return null;

  return result[0];
};

const getAllChrono = async(skip, take, show, ask, userId) => {
  const aggregation = [
    {
      $lookup: {
        from: Collections.Users,
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $lookup: {
        from: Collections.Comments,
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
        base_url: 1,
        karma: 1,
        created_on: 1,
        comment_count: { $size: '$comments' },
      },
    },
    { $sort: { created_on: -1 } },
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
  ];

  if (show) aggregation.splice(0, 0, { $match: { title: { $regex: `^${config.defaultValues.showStartWith}`, $options: 'i' } } });
  if (ask) aggregation.splice(0, 0, { $match: { title: { $regex: `^${config.defaultValues.askStartWith}`, $options: 'i' } } });
  if (userId) aggregation.splice(0, 0, { $match: { user_id: ObjectID(userId) } });
  const result = await storyCollection().aggregate(aggregation).toArray();

  if (!result || result.length === 0) return null;

  return result[0];
};

const getAll = async(skip, take, show, ask, userId) => {
  const aggregation = [
    {
      $lookup: {
        from: Collections.Users,
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $lookup: {
        from: Collections.Comments,
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
        base_url: 1,
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
  ];

  if (show) aggregation.splice(0, 0, { $match: { title: { $regex: `^${config.defaultValues.showStartWith}`, $options: 'i' } } });
  if (ask) aggregation.splice(0, 0, { $match: { title: { $regex: `^${config.defaultValues.askStartWith}`, $options: 'i' } } });
  if (userId) aggregation.splice(0, 0, { $match: { user_id: ObjectID(userId) } });
  const result = await storyCollection().aggregate(aggregation).toArray();

  if (!result || result.length === 0) return null;

  return result[0];
};

const create = async(userId, title, text, url) => {
  return await storyCollection().insertOne({
    user_id: ObjectID(userId),
    title: title,
    text: text,
    url: url,
    base_url: helper.toBaseURL(url),
    karma: 1,
    created_on: new Date(),
  });
};

const incrementVote = async(storyId, voteDiff) => {
  return await storyCollection().updateOne(
    { _id: ObjectID(storyId) },
    { $inc: { karma: voteDiff } },
  );
};

export {
  findOneStrict,
  findOne,
  getAll,
  getAllChrono,
  create,
  incrementVote,
};
