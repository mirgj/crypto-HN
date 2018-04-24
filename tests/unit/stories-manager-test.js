import { ObjectID } from 'mongodb';
import { expect } from 'chai';
import { logger } from '../../src/helpers/logger';
import { Collections } from '../../src/constants/index';
import { __Rewire__ } from '../../src/db/stories-manager';
import sinon from 'sinon';
import config from '../../config';
import * as storiesManager from '../../src/db/stories-manager';

const dbMock = {
  findOne: (find, project) => { },
  aggregate: (pipeline) => { },
  insertOne: (data) => { },
  updateOne: (find, set) => { },
};
const dbStateMock = {
  defaultDbInstance: {
    collection: (name) => {
      return dbMock;
    },
  },
};
const aggregateReturnMock = {
  toArray: () => { },
};
const helperMock = {
  toBaseURL: (value) => { },
};

describe('## Stories manager unit tests', () => {

  before(() => {
    logger.transports[0].level = 'error';

    __Rewire__('dbState', dbStateMock);
    __Rewire__('helper', helperMock);
  });

  let collectionSpy;
  let aggregateSpy;
  let toArraySpy;

  beforeEach(() => {
    collectionSpy = sinon.spy(dbStateMock.defaultDbInstance, 'collection');
    aggregateSpy = sinon.stub(dbMock, 'aggregate');
    toArraySpy = sinon.stub(aggregateReturnMock, 'toArray');
  });

  afterEach(() => {
    collectionSpy.restore();
    aggregateSpy.restore();
    toArraySpy.restore();
  });

  describe('# findOneStrict', () => {

    it('it should fail with a wrong ID', async() => {
      const storyId = 'wrong id';
      const returnValue = { };
      const findOneSpy = sinon.stub(dbMock, 'findOne').returns(Promise.resolve(returnValue));

      try {
        await storiesManager.findOneStrict(storyId);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        findOneSpy.restore();
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.notCalled(findOneSpy);
      }
    });

    it('it should find the record correctly', async() => {
      const storyId = '507f1f77bcf86cd799439011';
      const returnValue = { };
      const findOneSpy = sinon.stub(dbMock, 'findOne').returns(Promise.resolve(returnValue));

      const result = await storiesManager.findOneStrict(storyId);

      findOneSpy.restore();
      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWithExactly(findOneSpy, { _id: ObjectID(storyId) });

      expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });

  });

  describe('# findOne', () => {

    it('it should call findOne correctly', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      const returnStory = { url: 'http://google.it' };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await storiesManager.findOne(storyIdTest);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnStory);
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.deep.equal({ $match: { _id: ObjectID(storyIdTest) } });
    });

    it('it should call findOne correctly and get an empty result', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([]));

      const result = await storiesManager.findOne(storyIdTest);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.null;
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.deep.equal({ $match: { _id: ObjectID(storyIdTest) } });
    });

    it('it should call findOne correctly and get null', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve(null));

      const result = await storiesManager.findOne(storyIdTest);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.null;
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.deep.equal({ $match: { _id: ObjectID(storyIdTest) } });
    });

    it('it should fail to call findOne with a wrong ObjectID', async() => {
      const storyIdTest = 'wrong ObjectID';
      const returnStory = { url: 'http://google.it' };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      try {
        await storiesManager.findOne(storyIdTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        sinon.assert.notCalled(collectionSpy);
        sinon.assert.notCalled(aggregateSpy);
        sinon.assert.notCalled(toArraySpy);
      }
    });

    it('it should fail to call findOne rejected promise', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      const error = new Error('error');
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.reject(error));

      try {
        await storiesManager.findOne(storyIdTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err).to.be.equal(error);
      } finally {
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
        sinon.assert.calledOnce(aggregateSpy);
        sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
        sinon.assert.calledOnce(toArraySpy);
        const args = aggregateSpy.getCall(0).args[0];

        expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
        expect(args[0]).to.be.an('object');
        expect(args[0]).to.deep.equal({ $match: { _id: ObjectID(storyIdTest) } });
      }
    });

  });

  describe('# getAllChrono', () => {

    it('it should call getAllChrono correctly', async() => {
      const returnStory = { url: 'http://google.it' };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await storiesManager.getAllChrono(0, 100);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnStory);
      expect(args[4]).to.be.an('object');
      expect(args[4]).to.be.deep.equal({ $sort: { created_on: -1 } });
      expect(args[5]).to.be.an('object');
      expect(args[5]).to.be.deep.equal(
        {
          $facet: {
            page_info: [ { $count: 'total_count' } ],
            stories: [ { $skip: 0 }, { $limit: 100 } ],
          },
        }
      );
    });

    it('it should call getAllChrono correctly and get an empty result', async() => {
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([]));

      const result = await storiesManager.getAllChrono(0, 100);
      expect(result).to.be.null;
    });

    it('it should call getAllChrono correctly and get a null result', async() => {
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve(null));

      const result = await storiesManager.getAllChrono(0, 100);

      expect(result).to.be.null;
    });

    it('it should call getAllChrono correctly for "show"', async() => {
      const returnStory = { url: 'http://google.it' };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await storiesManager.getAllChrono(0, 100, true);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnStory);
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.be.deep.equal({ $match: { title: { $regex: `^${config.defaultValues.showStartWith}`, $options: 'i' } } });
      expect(args[5]).to.be.an('object');
      expect(args[5]).to.be.deep.equal({ $sort: { created_on: -1 } });
    });

    it('it should call getAllChrono correctly for "ask"', async() => {
      const returnStory = { url: 'http://google.it' };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await storiesManager.getAllChrono(0, 100, null, true);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnStory);
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.be.deep.equal({ $match: { title: { $regex: `^${config.defaultValues.askStartWith}`, $options: 'i' } } });
      expect(args[5]).to.be.an('object');
      expect(args[5]).to.be.deep.equal({ $sort: { created_on: -1 } });
    });

    it('it should call getAllChrono correctly for specific userId', async() => {
      const returnStory = { url: 'http://google.it' };
      const userId = '507f1f77bcf86cd799439011';
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await storiesManager.getAllChrono(0, 100, null, null, userId);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
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
      expect(args[5]).to.be.an('object');
      expect(args[5]).to.be.deep.equal({ $sort: { created_on: -1 } });
    });

  });

  describe('# getAll', () => {

    it('it should call getAll correctly', async() => {
      const returnStory = { url: 'http://google.it' };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await storiesManager.getAll(0, 100);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnStory);
      expect(args[4]).to.be.an('object');
      expect(args[4]).to.be.deep.equal({ $sort: { timestamp_karma: -1 } });
      expect(args[5]).to.be.an('object');
      expect(args[5]).to.be.deep.equal(
        {
          $facet: {
            page_info: [ { $count: 'total_count' } ],
            stories: [ { $skip: 0 }, { $limit: 100 } ],
          },
        }
      );
    });

    it('it should call getAll correctly and get an empty result', async() => {
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([]));

      const result = await storiesManager.getAll(0, 100);
      expect(result).to.be.null;
    });

    it('it should call getAll correctly and get a null result', async() => {
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve(null));

      const result = await storiesManager.getAll(0, 100);

      expect(result).to.be.null;
    });

    it('it should call getAll correctly for "show"', async() => {
      const returnStory = { url: 'http://google.it' };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await storiesManager.getAll(0, 100, true);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnStory);
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.be.deep.equal({ $match: { title: { $regex: `^${config.defaultValues.showStartWith}`, $options: 'i' } } });
      expect(args[5]).to.be.an('object');
      expect(args[5]).to.be.deep.equal({ $sort: { timestamp_karma: -1 } });
    });

    it('it should call getAll correctly for "ask"', async() => {
      const returnStory = { url: 'http://google.it' };
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await storiesManager.getAll(0, 100, null, true);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraySpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnStory);
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.be.deep.equal({ $match: { title: { $regex: `^${config.defaultValues.askStartWith}`, $options: 'i' } } });
      expect(args[5]).to.be.an('object');
      expect(args[5]).to.be.deep.equal({ $sort: { timestamp_karma: -1 } });
    });

    it('it should call getAll correctly for specific userId', async() => {
      const returnStory = { url: 'http://google.it' };
      const userId = '507f1f77bcf86cd799439011';
      aggregateSpy.returns(aggregateReturnMock);
      toArraySpy.returns(Promise.resolve([returnStory]));

      const result = await storiesManager.getAll(0, 100, null, null, userId);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
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
      expect(args[5]).to.be.an('object');
      expect(args[5]).to.be.deep.equal({ $sort: { timestamp_karma: -1 } });
    });

  });

  describe('# create', () => {

    it('it should create the story correctly', async() => {
      const userId = '507f1f77bcf86cd799439011';
      const title = 'title';
      const text = 'content text';
      const url = 'http://google.com';
      const base_url = 'google.it';
      const returnValue = { acknowledged: true };
      const baseUrlSpy = sinon.stub(helperMock, 'toBaseURL').returns(base_url);
      const insertOneSpy = sinon.stub(dbMock, 'insertOne').returns(Promise.resolve(returnValue));

      const result = await storiesManager.create(userId, title, text, url);

      insertOneSpy.restore();
      baseUrlSpy.restore();
      sinon.assert.calledOnce(baseUrlSpy);
      sinon.assert.calledWithExactly(baseUrlSpy, url);
      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(insertOneSpy);
      sinon.assert.calledWithExactly(insertOneSpy, {
        user_id: ObjectID(userId),
        title: title,
        text: text,
        url: url,
        base_url: base_url,
        karma: 1,
        created_on: sinon.match.date,
      });

      expect(collectionSpy.calledBefore(insertOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });

    it('it should fail to create the user', async() => {
      const userId = '507f1f77bcf86cd799439011';
      const title = 'title';
      const text = 'content text';
      const url = 'http://google.com';
      const base_url = 'google.it';
      const returnValue = new Error('err');
      const baseUrlSpy = sinon.stub(helperMock, 'toBaseURL').returns(base_url);
      const insertOneSpy = sinon.stub(dbMock, 'insertOne').returns(Promise.reject(returnValue));

      try {
        await storiesManager.create(userId, title, text, url);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err).to.be.equal(returnValue);
      } finally {
        insertOneSpy.restore();

        sinon.assert.calledOnce(baseUrlSpy);
        sinon.assert.calledWithExactly(baseUrlSpy, url);
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
        sinon.assert.calledOnce(insertOneSpy);
        sinon.assert.calledWithExactly(insertOneSpy, {
          user_id: ObjectID(userId),
          title: title,
          text: text,
          url: url,
          base_url: base_url,
          karma: 1,
          created_on: sinon.match.date,
        });

        expect(collectionSpy.calledBefore(insertOneSpy)).to.be.true;
      }
    });

  });

  describe('# incrementVote', () => {

    it('it should fail to increment the vote with a wrong ObjectID', async() => {
      const storyIdTest = 'wrong ObjectID';
      const voteDiff = -1;
      const returnValue = { acknowledged: true };
      const updateOneSpy = sinon.stub(dbMock, 'updateOne').returns(Promise.resolve(returnValue));

      try {
        await storiesManager.incrementVote(storyIdTest, voteDiff);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        updateOneSpy.restore();
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
        sinon.assert.notCalled(updateOneSpy);
      }
    });

    it('should increment the vote correctly', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      const voteDiff = -1;
      const returnValue = { acknowledged: true };
      const updateOneSpy = sinon.stub(dbMock, 'updateOne').returns(Promise.resolve(returnValue));

      const result = await storiesManager.incrementVote(storyIdTest, voteDiff);

      updateOneSpy.restore();
      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(updateOneSpy);
      sinon.assert.calledWithExactly(updateOneSpy, { _id: ObjectID(storyIdTest) }, { $inc: { karma: voteDiff } });

      expect(collectionSpy.calledBefore(updateOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });

  });

});
