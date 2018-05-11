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
  deleteOne: (find, set) => { },
  find: (find) => { },
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
      const storyId = 'wrong id';
      const returnValue = { };
      findOneSpy.returns(Promise.resolve(returnValue));

      try {
        await commentsManager.findOne(storyId);
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
      const storyId = '507f1f77bcf86cd799439011';
      const returnValue = { };
      findOneSpy.returns(Promise.resolve(returnValue));

      const result = await commentsManager.findOne(storyId);

      sinon.assert.calledOnce(collectionSpy);
      sinon.assert.calledWithExactly(collectionSpy, Collections.Comments);
      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWithExactly(findOneSpy, { _id: ObjectID(storyId) });

      expect(collectionSpy.calledBefore(findOneSpy)).to.be.true;
      expect(result).to.be.not.null;
      expect(result).to.be.an('object');
      expect(result).to.be.equal(returnValue);
    });
  });

});
