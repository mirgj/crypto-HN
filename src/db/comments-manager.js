import { ObjectID } from 'mongodb';
import { state as dbState } from './connector';
import { Collections } from '../constants/index';

const commentCollection = () => dbState.defaultDbInstance.collection(Collections.Comments);

const findOne = async(commentId) => {
  return await commentCollection().findOne({ _id: ObjectID(commentId) });
};

const getAllChrono = async(skipt, take, userId) => {
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
        parent: 1,
        deleted: 1,
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
  ];
  if (userId) aggregation.splice(0, 0, { $match: { user_id: ObjectID(userId) } });
  const result = await commentCollection().aggregate(aggregation).toArray();

  if (!result || result.length === 0) return null;

  return result[0];
};

const getAllByStory = async(storyId, commentId) => {
  let matchFilter = { story_id: ObjectID(storyId) };
  if (commentId) {
    matchFilter = { $and: [
      { story_id: ObjectID(storyId) },
      { $or: [ { _id: ObjectID(commentId) }, { parent: ObjectID(commentId) } ] },
    ] };
  }

  const result = await commentCollection().aggregate([
    { $match: matchFilter },
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

const create = async(userId, storyId, text, parentCommentId) => {
  let baseObj = {
    user_id: ObjectID(userId),
    story_id: ObjectID(storyId),
    text: text,
    karma: 1,
    created_on: new Date(),
  };

  if (parentCommentId) {
    baseObj.parent = ObjectID(parentCommentId);
  }

  return await commentCollection().insertOne(baseObj);
};

const incrementVote = async(commentId, voteDiff) => {
  return await commentCollection().updateOne(
    { _id: ObjectID(commentId) },
    { $inc: { karma: voteDiff } },
  );
};

const update = async(commentId, text, deleted) => {
  var obj = { text: text, updated_on: new Date() };

  if (deleted) {
    obj.deleted = true;
  }

  return await commentCollection().updateOne(
    { _id: ObjectID(commentId) },
    { $set: obj },
  );
};

export {
  findOne,
  getAllChrono,
  getAllByStory,
  create,
  incrementVote,
  update,
};
