import { ObjectID } from 'mongodb';
import { expect } from 'chai';
import { logger } from '../../src/helpers/logger';
import { Collections } from '../../src/constants/index';
import { __Rewire__ } from '../../src/db/stories-manager';
import sinon from 'sinon';
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

  beforeEach(() => {
    collectionSpy = sinon.spy(dbStateMock.defaultDbInstance, 'collection');
  });

  afterEach(() => {
    collectionSpy.restore();
  });

  describe('# findOne', () => {
    let aggregateSpy;

    beforeEach(() => {
      aggregateSpy = sinon.stub(dbMock, 'aggregate');
    });

    afterEach(() => {
      aggregateSpy.restore();
    });

    it('it should call findOne correctly', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      const returnStory = { url: 'http://google.it' };
      const toArraSpy = sinon.stub(aggregateReturnMock, 'toArray');
      aggregateSpy.returns(aggregateReturnMock);
      toArraSpy.returns(Promise.resolve([returnStory]));

      const result = await storiesManager.findOne(storyIdTest);

      toArraSpy.restore();
      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Stories);
      sinon.assert.calledOnce(aggregateSpy);
      sinon.assert.calledWithExactly(aggregateSpy, sinon.match.array);
      sinon.assert.calledOnce(toArraSpy);
      const args = aggregateSpy.getCall(0).args[0];

      expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnStory);
      expect(args[0]).to.be.an('object');
      expect(args[0]).to.deep.equal({ $match: { _id: ObjectID(storyIdTest) } });
    });

    it('it should fail to call findOne with a wrong ObjectID', async() => {
      const storyIdTest = 'wrong ObjectID';
      const returnStory = { url: 'http://google.it' };
      const toArraSpy = sinon.stub(aggregateReturnMock, 'toArray');
      aggregateSpy.returns(aggregateReturnMock);
      toArraSpy.returns(Promise.resolve([returnStory]));

      try {
        await storiesManager.findOne(storyIdTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        toArraSpy.restore();
        sinon.assert.notCalled(collectionSpy);
        sinon.assert.notCalled(aggregateSpy);
        sinon.assert.notCalled(toArraSpy);
      }
    });

    it('it should fail to call findOne rejected promise', async() => {
      const storyIdTest = '507f1f77bcf86cd799439011';
      const error = new Error('error');
      const toArraSpy = sinon.stub(aggregateReturnMock, 'toArray');
      aggregateSpy.returns(aggregateReturnMock);
      toArraSpy.returns(Promise.reject(error));

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
        sinon.assert.calledOnce(toArraSpy);
        const args = aggregateSpy.getCall(0).args[0];

        expect(collectionSpy.calledBefore(aggregateSpy)).to.be.true;
        expect(args[0]).to.be.an('object');
        expect(args[0]).to.deep.equal({ $match: { _id: ObjectID(storyIdTest) } });
      }
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

});
