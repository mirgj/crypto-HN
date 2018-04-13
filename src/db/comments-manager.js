import { ObjectID } from 'mongodb';
import { state as dbState } from './connector';
import { Collections } from '../constants/index';

const commentCollection = () => dbState.defaultDbInstance.collection(Collections.Comments);

const getAllChrono = async(skipt, take) => {
  const result = await commentCollection().aggregate([
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
        from: Collections.Stories,
        localField: 'story_id',
        foreignField: '_id',
        as: 'story',
      },
    },
    { $unwind: '$user' },
    { $unwind: '$story' },
    {
      $project: {
        'user._id': 1,
        'user.username': 1,
        'story._id': 1,
        'story.title': 1,
        text: 1,
        karma: 1,
        created_on: 1,
        updated_on: 1,
      },
    },
    { $sort: { created_on: -1 } },
    {
      $facet: {
        page_info: [ { $count: 'total_count' } ],
        comments: [ { $skip: 0 }, { $limit: 100} ],
      },
    },
    { $unwind: '$page_info' },
    {
      $project: {
        comments_count: '$page_info.total_count',
        comments: 1,
      },
    },
  ]).toArray();
  if (!result || result.length === 0) return null;

  return result;
};

const getAllByStory = async(storyId) => {
  const result = await commentCollection().aggregate([
    { $match: { story_id: ObjectID(storyId) } },
    {
      $lookup: {
        from: Collections.Users,
        localField: 'user_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        'user._id': 1,
        'user.username': 1,
        text: 1,
        karma: 1,
        parent: 1,
        deleted: 1,
        created_on: 1,
        updated_on: 1,
      },
    },
    { $sort: { karma: -1 } },
  ]).toArray();
  if (!result || result.length === 0) return null;

  return result;
};

const create = async(userId, storyId, text) => {
  return await commentCollection().insertOne({
    user_id: ObjectID(userId),
    story_id: ObjectID(storyId),
    text: text,
    karma: 1,
    created_on: new Date(),
  });
};

const incrementVote = async(commentId, voteDiff) => {
  return await commentCollection().updateOne(
    { _id: ObjectID(commentId) },
    { $inc: { karma: voteDiff } },
  );
};

export {
  getAllChrono,
  getAllByStory,
  create,
  incrementVote,
};
