import { MongoError } from 'mongodb';
import { expect } from 'chai';
import { Errors, Infos } from '../../../src/constants/index';
import { ApiResult, InsertResult, OkResult } from '../../../src/results/api-data';
import { ApiError, NotFoundError, UnauthorizedError } from '../../../src/results/api-errors';
import { logger } from '../../../src/helpers/logger';
import { __Rewire__ } from '../../../src/controllers/users-controller';
import sinon from 'sinon';
import * as usersController from '../../../src/controllers/users-controller';

const managerMock = {
  findOne: () => { },
  findOneByUsername: () => { },
  create: () => { },
  update: () => { },
};
const helperMock = {
  generateHash: () => { },
};

describe('## controllers/users-controller.js unit tests', () => {

  before(() => {
    logger.transports[0].level = 'error';

    __Rewire__('manager', managerMock);
    __Rewire__('hashHelper', helperMock);
  });

  describe('# getLogin', () => {
    let findOneByUsernameSpy;

    beforeEach(() => {
      findOneByUsernameSpy = sinon.stub(managerMock, 'findOneByUsername');
    });

    afterEach(() => {
      findOneByUsernameSpy.restore();
    });

    it('it should return an ApiResult correctly', async() => {
      const returnValue = { };
      const username = 'usernamemock';
      findOneByUsernameSpy.returns(Promise.resolve(returnValue));

      const result = await usersController.getLogin(username);

      sinon.assert.calledOnce(findOneByUsernameSpy);
      sinon.assert.calledWithExactly(findOneByUsernameSpy, username);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult(returnValue));
    });

    it('it should throw an NotFoundError', async() => {
      const returnValue = null;
      const username = 'usernamemock';
      findOneByUsernameSpy.returns(Promise.resolve(returnValue));

      try {
        await usersController.getLogin(username);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.USERNAME_NOT_FOUND));
      } finally {
        sinon.assert.calledOnce(findOneByUsernameSpy);
        sinon.assert.calledWithExactly(findOneByUsernameSpy, username);
      }

    });

  });

  describe('# get', () => {
    let findOneSpy;

    beforeEach(() => {
      findOneSpy = sinon.stub(managerMock, 'findOne');
    });

    afterEach(() => {
      findOneSpy.restore();
    });

    it('it should return an ApiResult correctly', async() => {
      const returnValue = { };
      const userId = 'userIdmock';
      findOneSpy.returns(Promise.resolve(returnValue));

      const result = await usersController.get(userId);

      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWithExactly(findOneSpy, userId);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult(returnValue));
    });

    it('it should throw an NotFoundError', async() => {
      const returnValue = null;
      const userId = 'userIdmock';
      findOneSpy.returns(Promise.resolve(returnValue));

      try {
        await usersController.get(userId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.USER_NOT_FOUND));
      } finally {
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWithExactly(findOneSpy, userId);
      }

    });

  });

  describe('# encloseToken', () => {
    it('it should return an ApiResult correctly', async() => {
      const result = await usersController.encloseToken('token');

      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult({
        auth: true,
        token: 'token',
      }));
    });

    it('it should throw an NotFoundError', async() => {
      try {
        await usersController.encloseToken(null);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new UnauthorizedError(Errors.USER_WRONG_PASSWORD));
      }

    });

  });

  describe('# update', () => {
    let updateSpy;

    beforeEach(() => {
      updateSpy = sinon.stub(managerMock, 'update');
    });

    afterEach(() => {
      updateSpy.restore();
    });

    it('it should return an OkResult correctly', async() => {
      const returnValue = {result: { n: 1, ok: true } };
      const userId = 'userIdmock';
      const email = 'emailmock';
      const about = 'aboutmock';
      updateSpy.returns(Promise.resolve(returnValue));

      const result = await usersController.update(userId, email, about);

      sinon.assert.calledOnce(updateSpy);
      sinon.assert.calledWithExactly(updateSpy, userId, email, about);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.UPDATE_USER_INFO));
    });

    it('it should throw an NotFoundError', async() => {
      const returnValue = {result: { n: 0, ok: true } };
      const userId = 'userIdmock';
      const email = 'emailmock';
      const about = 'aboutmock';
      updateSpy.returns(Promise.resolve(returnValue));

      try {
        await usersController.update(userId, email, about);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.USER_NOT_FOUND));
      } finally {
        sinon.assert.calledOnce(updateSpy);
        sinon.assert.calledWithExactly(updateSpy, userId, email, about);
      }

    });

    it('it should throw an ApiError', async() => {
      const returnValue = {result: { n: 1, ok: false } };
      const userId = 'userIdmock';
      const email = 'emailmock';
      const about = 'aboutmock';
      updateSpy.returns(Promise.resolve(returnValue));

      try {
        await usersController.update(userId, email, about);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.UPDATE_USER_ERROR));
      } finally {
        sinon.assert.calledOnce(updateSpy);
        sinon.assert.calledWithExactly(updateSpy, userId, email, about);
      }

    });

  });

  describe('# create', () => {
    let createSpy;
    let hashPasswordSpy;

    beforeEach(() => {
      createSpy = sinon.stub(managerMock, 'create');
      hashPasswordSpy = sinon.stub(helperMock, 'generateHash');
    });

    afterEach(() => {
      createSpy.restore();
      hashPasswordSpy.restore();
    });

    it('it should return an InsertResult correctly', async() => {
      const returnValue = {result: { ok: true }, insertedCount: 1, insertedId: 111 };
      const username = 'usernamemock';
      const password = 'passwordmock';
      const hashedpassword = 'hashedpassword';
      hashPasswordSpy.returns(Promise.resolve(hashedpassword));
      createSpy.returns(Promise.resolve(returnValue));

      const result = await usersController.create(username, password);

      sinon.assert.calledOnce(createSpy);
      sinon.assert.calledOnce(hashPasswordSpy);
      sinon.assert.calledWithExactly(createSpy, username, hashedpassword);
      sinon.assert.calledWithExactly(hashPasswordSpy, password);
      expect(hashPasswordSpy.calledBefore(createSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new InsertResult(Infos.CREATE_USER_INFO, returnValue.insertedId));
    });

    it('it should return an ApiError correctly', async() => {
      const returnValue = {result: { ok: false }, insertedCount: 1, insertedId: 111 };
      const username = 'usernamemock';
      const password = 'passwordmock';
      const hashedpassword = 'hashedpassword';
      hashPasswordSpy.returns(Promise.resolve(hashedpassword));
      createSpy.returns(Promise.resolve(returnValue));

      try {
        await usersController.create(username, password);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.CREATE_USER_ERROR));
      } finally {
        sinon.assert.calledOnce(createSpy);
        sinon.assert.calledOnce(hashPasswordSpy);
        sinon.assert.calledWithExactly(createSpy, username, hashedpassword);
        sinon.assert.calledWithExactly(hashPasswordSpy, password);
        expect(hashPasswordSpy.calledBefore(createSpy)).to.be.true;
      }
    });

    it('it should return an ApiError correctly', async() => {
      const returnValue = {result: { ok: true }, insertedCount: 0, insertedId: 111 };
      const username = 'usernamemock';
      const password = 'passwordmock';
      const hashedpassword = 'hashedpassword';
      hashPasswordSpy.returns(Promise.resolve(hashedpassword));
      createSpy.returns(Promise.resolve(returnValue));

      try {
        await usersController.create(username, password);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.CREATE_USER_ERROR));
      } finally {
        sinon.assert.calledOnce(createSpy);
        sinon.assert.calledOnce(hashPasswordSpy);
        sinon.assert.calledWithExactly(createSpy, username, hashedpassword);
        sinon.assert.calledWithExactly(hashPasswordSpy, password);
        expect(hashPasswordSpy.calledBefore(createSpy)).to.be.true;
      }
    });

    it('it should return an ApiError correctly (db exception)', async() => {
      const username = 'usernamemock';
      const password = 'passwordmock';
      const hashedpassword = 'hashedpassword';
      hashPasswordSpy.returns(Promise.resolve(hashedpassword));
      createSpy.returns(Promise.reject(new MongoError('')));

      try {
        await usersController.create(username, password);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.CREATE_USER_USERNAME_ERROR));
      } finally {
        sinon.assert.calledOnce(createSpy);
        sinon.assert.calledOnce(hashPasswordSpy);
        sinon.assert.calledWithExactly(createSpy, username, hashedpassword);
        sinon.assert.calledWithExactly(hashPasswordSpy, password);
        expect(hashPasswordSpy.calledBefore(createSpy)).to.be.true;
      }
    });

  });

});
