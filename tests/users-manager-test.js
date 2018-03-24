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
    }
  }
};

describe('## User manager', () => {

  before(() => {
    logger.transports[0].level = 'error';

    __Rewire__('dbState', dbStateMock);
  });

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

});
