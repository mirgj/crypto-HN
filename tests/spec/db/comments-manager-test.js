import { ObjectID } from 'mongodb';
import { expect } from 'chai';
import { logger } from '../../../src/helpers/logger';
import { Collections } from '../../../src/constants/index';
import { __Rewire__ } from '../../../src/db/comments-manager';
import sinon from 'sinon';
import * as commentsManager from '../../../src/db/comments-manager';

const dbMock = {
  findOne: (find, project) => { },
  insertOne: (data) => { },
  find: (find) => { },
  updateOne: (find, set) => { },
  aggregate: (pipeline) => { },
};
const aggregateReturnMock = {
  toArray: () => { },
};
const dbStateMock = {
  defaultDbInstance: {
    collection: (name) => {
      return dbMock;
    },
  },
};

describe('## manager/comments-manager.js unit tests', () => {

  before(() => {
    logger.transports[0].level = 'error';

    __Rewire__('dbState', dbStateMock);
  });
  let collectionSpy;

  beforeEach(() => {
    collectionSpy = sinon.spy(dbStateMock.defaultDbInstance, 'collection');
  });

  afterEach(() => {
    collectionSpy.restore();
  });

  describe('# findOne', () => {
    let findOneSpy;

    beforeEach(() => {
      findOneSpy = sinon.stub(dbMock, 'findOne');
    });

    afterEach(() => {
      findOneSpy.restore();
    });

    it('it should fail with a wrong ID', async() => {
      const commentIdTest = 'wrong id';
      const returnValue = { };
      findOneSpy.returns(Promise.resolve(returnValue));

      try {
        await commentsManager.findOne(commentIdTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.notCalled(findOneSpy);
      }
    });

    it('it should find the record correctly', async() => {
      const commentIdTest = '507f1f77bcf86cd799439011';
      const returnValue = { };
      findOneSpy.returns(Promise.resolve(returnValue));

      const result = await commentsManager.findOne(commentIdTest);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWithExactly(findOneSpy, { _id: ObjectID(commentIdTest) });

      expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });
  });

  describe('# incrementVote', () => {
    let updateOneSpy;

    beforeEach(() => {
      updateOneSpy = sinon.stub(dbMock, 'updateOne');
    });

    afterEach(() => {
      updateOneSpy.restore();
    });

    it('it should fail to increment the vote with a wrong ObjectID', async() => {
      const commentIdTest = 'wrong ObjectID';
      const voteDiff = -1;
      const returnValue = { acknowledged: true };
      updateOneSpy.returns(Promise.resolve(returnValue));

      try {
        await commentsManager.incrementVote(commentIdTest, voteDiff);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
        sinon.assert.notCalled(updateOneSpy);
      }
    });

    it('should increment the vote correctly', async() => {
      const commentIdTest = '507f1f77bcf86cd799439011';
      const voteDiff = -1;
      const returnValue = { acknowledged: true };
      updateOneSpy.returns(Promise.resolve(returnValue));

      const result = await commentsManager.incrementVote(commentIdTest, voteDiff);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(updateOneSpy);
      sinon.assert.calledWithExactly(updateOneSpy, { _id: ObjectID(commentIdTest) }, { $inc: { karma: voteDiff } });

      expect(collectionSpy.calledBefore(updateOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });

  });

  describe('# update', () => {
    let updateOneSpy;

    beforeEach(() => {
      updateOneSpy = sinon.stub(dbMock, 'updateOne');
    });

    afterEach(() => {
      updateOneSpy.restore();
    });

    it('it should fail to update the comment with a wrong ObjectID', async() => {
      const commentIdTest = 'wrong ObjectID';
      const text = '';
      const returnValue = { acknowledged: true };
      updateOneSpy.returns(Promise.resolve(returnValue));

      try {
        await commentsManager.update(commentIdTest, text);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
        sinon.assert.notCalled(updateOneSpy);
      }
    });

    it('should update the comment correctly', async() => {
      const commentIdTest = '507f1f77bcf86cd799439011';
      const text = 'new comment';
      const returnValue = { acknowledged: true };
      updateOneSpy.returns(Promise.resolve(returnValue));

      const result = await commentsManager.update(commentIdTest, text);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(updateOneSpy);
      sinon.assert.calledWithExactly(updateOneSpy, { _id: ObjectID(commentIdTest) }, {
        $set: {
          text: text,
          updated_on: sinon.match.date,
        },
      });

      expect(collectionSpy.calledBefore(updateOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });

    it('should update the comment correctly and flag as deleted', async() => {
      const commentIdTest = '507f1f77bcf86cd799439011';
      const text = 'new comment';
      const deleted = true;
      const returnValue = { acknowledged: true };
      updateOneSpy.returns(Promise.resolve(returnValue));

      const result = await commentsManager.update(commentIdTest, text, deleted);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(updateOneSpy);
      sinon.assert.calledWithExactly(updateOneSpy, { _id: ObjectID(commentIdTest) }, {
        $set: {
          text: text,
          deleted: true,
          updated_on: sinon.match.date,
        },
      });

      expect(collectionSpy.calledBefore(updateOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });

  });

  describe('# create', () => {
    let insertOneSpy;

    beforeEach(() => {
      insertOneSpy = sinon.stub(dbMock, 'insertOne');
    });

    afterEach(() => {
      insertOneSpy.restore();
    });

    it('it should create the comment correctly', async() => {
      const userId = '507f1f77bcf86cd799439011';
      const storyId = '507f1f77bcf86cd799439012';
      const text = 'text';
      const returnValue = { acknowledged: true };
      insertOneSpy.returns(Promise.resolve(returnValue));

      const result = await commentsManager.create(userId, storyId, text);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(insertOneSpy);
      sinon.assert.calledWithExactly(insertOneSpy, {
        user_id: ObjectID(userId),
        story_id: ObjectID(storyId),
        text: text,
        karma: 1,
        created_on: sinon.match.date,
      });

      expect(collectionSpy.calledBefore(insertOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });

    it('it should create the comment correctly with a parent comment', async() => {
      const userId = '507f1f77bcf86cd799439011';
      const storyId = '507f1f77bcf86cd799439012';
      const parentComment = '507f1f77bcf86cd799439013';
      const text = 'text';
      const returnValue = { acknowledged: true };
      insertOneSpy.returns(Promise.resolve(returnValue));

      const result = await commentsManager.create(userId, storyId, text, parentComment);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(insertOneSpy);
      sinon.assert.calledWithExactly(insertOneSpy, {
        user_id: ObjectID(userId),
        story_id: ObjectID(storyId),
        text: text,
        karma: 1,
        parent: ObjectID(parentComment),
        created_on: sinon.match.date,
      });

      expect(collectionSpy.calledBefore(insertOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });

    it('it should fail to create the user', async() => {
      const userId = '507f1f77bcf86cd799439011';
      const storyId = '507f1f77bcf86cd799439012';
      const text = 'text';
      const returnValue = new Error('err');
      insertOneSpy.returns(Promise.reject(returnValue));

      try {
        await commentsManager.create(userId, storyId, text);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err).to.be.equal(returnValue);
      } finally {
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
        sinon.assert.calledOnce(insertOneSpy);
        sinon.assert.calledWithExactly(insertOneSpy, {
          user_id: ObjectID(userId),
          story_id: ObjectID(storyId),
          text: text,
          karma: 1,
          created_on: sinon.match.date,
        });

        expect(collectionSpy.calledBefore(insertOneSpy)).to.be.true;
      }
    });

  });

  describe('# getAllByStory', () => {
    let aggregateSpy;
    let toArraySpy;

    beforeEach(() => {
      aggregateSpy = sinon.stub(dbMock, 'aggregate');
      toArraySpy = sinon.stub(aggregateReturnMock, 'toArray');
    });

    afterEach(() => {
      aggregateSpy.restore();
      toArraySpy.restore();
    });

    it('it should call getAllByStory correctly', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      const returnValue = { };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnValue]));

      const result = await commentsManager.getAllByStory(storyIdTest);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([returnValue]);
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.be.deep.equal({ $match: { story_id: ObjectID(storyIdTest) } });
      expect(args[6]).to.be.an('object');
      expect(args[6]).to.be.deep.equal({ $sort: { is_deleted: 1, karma: -1, created_on: -1 } });
    });

    it('it should call getAllByStory correctly for a specific parent comment', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      const commentIdTest = '507f1f77bcf86cd799439012';
      const returnValue = { };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnValue]));

      const result = await commentsManager.getAllByStory(storyIdTest, commentIdTest);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([returnValue]);
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.be.deep.equal({ $match:
        {
          $and: [
            { story_id: ObjectID(storyIdTest) },
            { $or: [ { _id: ObjectID(commentIdTest) }, { parent: ObjectID(commentIdTest) } ] },
          ],
        },
      });
      expect(args[6]).to.be.an('object');
      expect(args[6]).to.be.deep.equal({ $sort: { is_deleted: 1, karma: -1, created_on: -1 } });
    });

    it('it should call getAll correctly and get an empty result', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([]));

      const result = await commentsManager.getAllByStory(storyIdTest);

      expect(result).to.be.null;
    });

    it('it should call getAll correctly and get a null result', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve(null));

      const result = await commentsManager.getAllByStory(storyIdTest);

      expect(result).to.be.null;
    });

  });

  describe('# getAllChrono', () => {
    let aggregateSpy;
    let toArraySpy;

    beforeEach(() => {
      aggregateSpy = sinon.stub(dbMock, 'aggregate');
      toArraySpy = sinon.stub(aggregateReturnMock, 'toArray');
    });

    afterEach(() => {
      aggregateSpy.restore();
      toArraySpy.restore();
    });

    it('it should call getAllChrono correctly', async() => {
      const returnStory = { };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await commentsManager.getAllChrono(0, 100);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnStory);
      expect(args[5]).to.be.an('object');
      expect(args[5]).to.be.deep.equal({ $sort: { created_on: -1 } });
      expect(args[6]).to.be.an('object');
      expect(args[6]).to.be.deep.equal(
        {
          $facet: {
            page_info: [ { $count: 'total_count' } ],
            comments: [ { $skip: 0 }, { $limit: 100 } ],
          },
        }
      );
    });

    it('it should call getAllChrono correctly and get an empty result', async() => {
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([]));

      const result = await commentsManager.getAllChrono(0, 100);
      expect(result).to.be.null;
    });

    it('it should call getAllChrono correctly and get a null result', async() => {
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve(null));

      const result = await commentsManager.getAllChrono(0, 100);

      expect(result).to.be.null;
    });

    it('it should call getAllChrono correctly with a specific userId', async() => {
      const userId = '507f1f77bcf86cd799439011';
      const returnStory = { };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await commentsManager.getAllChrono(0, 100, userId);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnStory);
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.be.deep.equal({ $match: { user_id: ObjectID(userId) } });
      expect(args[6]).to.be.an('object');
      expect(args[6]).to.be.deep.equal({ $sort: { created_on: -1 } });
      expect(args[7]).to.be.an('object');
      expect(args[7]).to.be.deep.equal(
        {
          $facet: {
            page_info: [ { $count: 'total_count' } ],
            comments: [ { $skip: 0 }, { $limit: 100 } ],
          },
        }
      );
    });

  });

});
