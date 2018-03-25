import { ObjectID } from 'mongodb';
import { expect } from 'chai';
import { logger } from '../src/helpers/logger';
import { Collections } from '../src/constants/index';
import { __Rewire__ } from '../src/db/users-manager';
import sinon from 'sinon';
import * as usersManager from '../src/db/users-manager';

const dbMock = {
  findOne: (find, project) => { },
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

describe('## User manager unit tests', () => {

  before(() => {
    logger.transports[0].level = 'error';

    __Rewire__('dbState', dbStateMock);
  });

  describe('# findOneByUsername', () => {

    it('it should call findOneByUsername correctly', async() => {
      const userNameTest = 'test';
      const returnUser = { username: 'test' };
      const collectionSpy = sinon.spy(dbStateMock.defaultDbInstance, 'collection');
      const findOneSpy = sinon.stub(dbMock, 'findOne').returns(Promise.resolve(returnUser));

      const result = await usersManager.findOneByUsername(userNameTest);

      collectionSpy.restore();
      findOneSpy.restore();
      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWith(collectionSpy, Collections.Users);
      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWith(findOneSpy, { username: userNameTest });

      expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnUser);
    });

    it('it should fail to call findOneByUsername', async() => {
      const userNameTest = 'test';
      const error = new Error('error');
      const collectionSpy = sinon.spy(dbStateMock.defaultDbInstance, 'collection');
      const findOneSpy = sinon.stub(dbMock, 'findOne').returns(Promise.reject(error));

      try {
        await usersManager.findOneByUsername(userNameTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err).to.be.equal(error);
      } finally {
        collectionSpy.restore();
        findOneSpy.restore();
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWith(collectionSpy, Collections.Users);
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWith(findOneSpy, { username: userNameTest });

        expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      }
    });

  });

  describe('# findOne', () => {

    it('it should call findOne correctly', async() => {
      const userIdTest = '507f1f77bcf86cd799439011';
      const returnUser = { username: 'test' };
      const collectionSpy = sinon.spy(dbStateMock.defaultDbInstance, 'collection');
      const findOneSpy = sinon.stub(dbMock, 'findOne').returns(Promise.resolve(returnUser));

      const result = await usersManager.findOne(userIdTest);

      collectionSpy.restore();
      findOneSpy.restore();
      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWith(collectionSpy, Collections.Users);
      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWith(findOneSpy, { _id: ObjectID(userIdTest) }, { fields: { password: 0 } });

      expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnUser);
    });

    it('it should fail to call findOne with a wrong ObjectID', async() => {
      const userIdTest = 'wrong ObjectID';
      const returnUser = { username: 'test' };
      const collectionSpy = sinon.spy(dbStateMock.defaultDbInstance, 'collection');
      const findOneSpy = sinon.stub(dbMock, 'findOne').returns(Promise.resolve(returnUser));

      try {
        await usersManager.findOne(userIdTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal('Argument passed in must be a single String of 12 bytes or a string of 24 hex characters');
      } finally {
        collectionSpy.restore();
        findOneSpy.restore();
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWith(collectionSpy, Collections.Users);
        sinon.assert.notCalled(findOneSpy);

        expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      }
    });

    it('it should fail to call findOne', async() => {
      const userIdTest = '507f1f77bcf86cd799439011';
      const error = new Error('error');
      const collectionSpy = sinon.spy(dbStateMock.defaultDbInstance, 'collection');
      const findOneSpy = sinon.stub(dbMock, 'findOne').returns(Promise.reject(error));

      try {
        await usersManager.findOne(userIdTest);
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err).to.be.equal(error);
      } finally {
        collectionSpy.restore();
        findOneSpy.restore();
        sinon.assert.calledOnce(collectionSpy);
        sinon.assert.calledWith(collectionSpy, Collections.Users);
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWith(findOneSpy, { _id: ObjectID(userIdTest) }, { fields: { password: 0 } });

        expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      }
    });

  });

  describe('# create', () => {
    
  });

  describe('# update', () => {
    
  });

});
