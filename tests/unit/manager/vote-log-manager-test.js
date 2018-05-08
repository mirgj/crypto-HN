import { ObjectID } from 'mongodb';
import { expect } from 'chai';
import { logger } from '../../../src/helpers/logger';
import { Collections } from '../../../src/constants/index';
import { __Rewire__ } from '../../../src/db/vote-log-manager';
import sinon from 'sinon';
import * as voteLogManager from '../../../src/db/vote-log-manager';

const dbMock = {
  findOne: (find, project) => { },
  insertOne: (data) => { },
  deleteOne: (find, set) => { },
  find: (find) => { },
};
const findReturnMock = {
  toArray: () => { },
};
const dbStateMock = {
  defaultDbInstance: {
    collection: (name) => {
      return dbMock;
    },
  },
};

describe('## manager/vote-log-manager.js unit tests', () => {

  before(() => {
    logger.transports[0].level = 'error';

    __Rewire__('dbState', dbStateMock);
  });
  let collectionSpy;
  let toArraySpy;

  beforeEach(() => {
    collectionSpy = sinon.spy(dbStateMock.defaultDbInstance, 'collection');
    toArraySpy = sinon.stub(findReturnMock, 'toArray');
  });

  afterEach(() => {
    collectionSpy.restore();
    toArraySpy.restore();
  });

  describe('# findOneByUserIdObjectId', () => {

    it('it should call correctly', async() => {
      const userIdTest = '507f1f77bcf86cd799439011';
      const objectIdTest = '507f1f77bcf86cd799439012';
      const objectTypeTest = 'mock';
      const returnMock = {};
      const findOneSpy = sinon.stub(dbMock, 'findOne').returns(Promise.resolve(returnMock));

      const result = await voteLogManager.findOneByUserIdObjectId(userIdTest, objectIdTest, objectTypeTest);

      findOneSpy.restore();
      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.VoteLog);
      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWithExactly(findOneSpy, { user_id: ObjectID(userIdTest), object_id: ObjectID(objectIdTest), object_type: objectTypeTest });

      expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnMock);
    });

    it('it should fail to call with a wrong ObjectID', async() => {
      const userIdTest = 'wrong ObjectID';
      const objectIdTest = '507f1f77bcf86cd799439012';
      const objectTypeTest = 'mock';
      const returnMock = {};
      const findOneSpy = sinon.stub(dbMock, 'findOne').returns(Promise.resolve(returnMock));

      try {
        await voteLogManager.findOneByUserIdObjectId(userIdTest, objectIdTest, objectTypeTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        findOneSpy.restore();
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.VoteLog);
        sinon.assert.notCalled(findOneSpy);

        expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      }
    });

    it('it should fail to call with a wrong ObjectID', async() => {
      const userIdTest = '507f1f77bcf86cd799439011';
      const objectIdTest = 'wrong ObjectID';
      const objectTypeTest = 'mock';
      const returnMock = {};
      const findOneSpy = sinon.stub(dbMock, 'findOne').returns(Promise.resolve(returnMock));

      try {
        await voteLogManager.findOneByUserIdObjectId(userIdTest, objectIdTest, objectTypeTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        findOneSpy.restore();
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.VoteLog);
        sinon.assert.notCalled(findOneSpy);

        expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      }
    });

  });

  describe('# create', () => {

    it('it should create the log correctly', async() => {
      const userIdTest = '507f1f77bcf86cd799439011';
      const objectIdTest = '507f1f77bcf86cd799439012';
      const objectTypeTest = 'mock';
      const directionTest = 'up';
      const returnValue = { acknowledged: true };
      const insertOneSpy = sinon.stub(dbMock, 'insertOne').returns(Promise.resolve(returnValue));

      const result = await voteLogManager.create(userIdTest, objectIdTest, objectTypeTest, directionTest);

      insertOneSpy.restore();
      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.VoteLog);
      sinon.assert.calledOnce(insertOneSpy);
      sinon.assert.calledWithExactly(insertOneSpy, {
        user_id: ObjectID(userIdTest),
        object_id: ObjectID(objectIdTest),
        object_type: objectTypeTest,
        vote_direction: directionTest,
        created_on: sinon.match.date,
      });

      expect(collectionSpy.calledBefore(insertOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });

    it('it should fail to create the log', async() => {
      const userIdTest = '507f1f77bcf86cd799439011';
      const objectIdTest = '507f1f77bcf86cd799439012';
      const objectTypeTest = 'mock';
      const directionTest = 'up';
      const returnValue = new Error('err');
      const insertOneSpy = sinon.stub(dbMock, 'insertOne').returns(Promise.reject(returnValue));

      try {
        await voteLogManager.create(userIdTest, objectIdTest, objectTypeTest, directionTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err).to.be.equal(returnValue);
      } finally {
        insertOneSpy.restore();

        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.VoteLog);
        sinon.assert.calledOnce(insertOneSpy);
        sinon.assert.calledWithExactly(insertOneSpy, {
          user_id: ObjectID(userIdTest),
          object_id: ObjectID(objectIdTest),
          object_type: objectTypeTest,
          vote_direction: directionTest,
          created_on: sinon.match.date,
        });

        expect(collectionSpy.calledBefore(insertOneSpy)).to.be.true;
      }
    });

  });

  describe('# deleteOne', () => {

    it('it should call correctly', async() => {
      const userIdTest = '507f1f77bcf86cd799439011';
      const objectIdTest = '507f1f77bcf86cd799439012';
      const objectTypeTest = 'mock';
      const returnMock = {};
      const deleteOneSpy = sinon.stub(dbMock, 'deleteOne').returns(Promise.resolve(returnMock));

      const result = await voteLogManager.deleteOne(userIdTest, objectIdTest, objectTypeTest);

      deleteOneSpy.restore();
      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.VoteLog);
      sinon.assert.calledOnce(deleteOneSpy);
      sinon.assert.calledWithExactly(deleteOneSpy, { user_id: ObjectID(userIdTest), object_id: ObjectID(objectIdTest), object_type: objectTypeTest });

      expect(collectionSpy.calledBefore(deleteOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnMock);
    });

    it('it should fail to call with a wrong ObjectID', async() => {
      const userIdTest = 'wrong ObjectID';
      const objectIdTest = '507f1f77bcf86cd799439012';
      const objectTypeTest = 'mock';
      const returnMock = {};
      const deleteOneSpy = sinon.stub(dbMock, 'deleteOne').returns(Promise.resolve(returnMock));

      try {
        await voteLogManager.deleteOne(userIdTest, objectIdTest, objectTypeTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        deleteOneSpy.restore();
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.VoteLog);
        sinon.assert.notCalled(deleteOneSpy);

        expect(collectionSpy.calledBefore(deleteOneSpy)).to.be.true;
      }
    });

    it('it should fail to call with a wrong ObjectID', async() => {
      const userIdTest = '507f1f77bcf86cd799439011';
      const objectIdTest = 'wrong ObjectID';
      const objectTypeTest = 'mock';
      const returnMock = {};
      const deleteOneSpy = sinon.stub(dbMock, 'deleteOne').returns(Promise.resolve(returnMock));

      try {
        await voteLogManager.deleteOne(userIdTest, objectIdTest, objectTypeTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        deleteOneSpy.restore();
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWithExactly(collectionSpy, Collections.VoteLog);
        sinon.assert.notCalled(deleteOneSpy);

        expect(collectionSpy.calledBefore(deleteOneSpy)).to.be.true;
      }
    });

  });

  describe('# findByUserAndIdsRange', () => {

    it('it should call the function correctly', async() => {
      const userIdTest = '507f1f77bcf86cd799439011';
      const minIdTest = '507f1f77bcf86cd799439012';
      const maxIdTest = '507f1f77bcf86cd799439012';
      const objectTypeTest = 'mock';
      const returnMock = { };
      const findSpy = sinon.stub(dbMock, 'find').returns(findReturnMock);
      toArraySpy.returns(Promise.resolve([returnMock]));

      const result = await voteLogManager.findByUserAndIdsRange(userIdTest, minIdTest, maxIdTest, objectTypeTest);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.VoteLog);
      sinon.assert.calledOnce(findSpy);
      sinon.assert.calledOnce(toArraySpy);
      sinon.assert.calledWithExactly(findSpy, {
        user_id: ObjectID(userIdTest),
        object_id: { $gte: ObjectID(minIdTest), $lte: ObjectID(maxIdTest) },
        object_type: objectTypeTest,
      });

      expect(collectionSpy.calledBefore(findSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([returnMock]);
    });

  });

});
