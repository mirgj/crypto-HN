import { MongoError } from 'mongodb';
import { expect } from 'chai';
import { Errors, Warnings, Infos } from '../../../src/constants/index';
import { ApiResult, WarningResult, InsertResult, OkResult } from '../../../src/results/api-data';
import { ApiError, NotFoundError, BadRequestError, ForbiddenError } from '../../../src/results/api-errors';
import { logger } from '../../../src/helpers/logger';
import { __Rewire__ } from '../../../src/controllers/stories-controller';
import sinon from 'sinon';
import * as storiesController from '../../../src/controllers/stories-controller';

const managerMock = {
  getAll: () => { },
  getAllChrono: () => { },
  findOne: () => { },
  findOneStrict: () => { },
  create: () => { },
  deleteOne: () => { },
};

describe('## controllers/stories-controller.js unit tests', () => {

  before(() => {
    logger.transports[0].level = 'error';

    __Rewire__('manager', managerMock);
  });

  describe('# getOneById', () => {
    let findOneSpy;

    beforeEach(() => {
      findOneSpy = sinon.stub(managerMock, 'findOne');
    });

    afterEach(() => {
      findOneSpy.restore();
    });

    it('it should return an ApiResult correctly', async() => {
      const storyId = 'storyIdMock';
      const returnValue = { };
      findOneSpy.returns(Promise.resolve(returnValue));

      const result = await storiesController.getOneById(storyId);

      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWithExactly(findOneSpy, storyId);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult(returnValue));
    });

    it('it should return a NotFoundError correctly', async() => {
      const storyId = 'storyIdMock';
      const returnValue = null;
      findOneSpy.returns(Promise.resolve(returnValue));

      try {
        await storiesController.getOneById(storyId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.STORY_NOT_FOUND));
      } finally {
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWithExactly(findOneSpy, storyId);
      }
    });

  });

  describe('# getStories', () => {
    let getAllSpy;

    beforeEach(() => {
      getAllSpy = sinon.stub(managerMock, 'getAll');
    });

    afterEach(() => {
      getAllSpy.restore();
    });

    it('it should return an ApiResult correctly', async() => {
      const returnValue = [{ }];
      const skip = 0;
      const take = 10;
      const show = false;
      const ask = false;
      const userId = 'userIdMock';
      getAllSpy.returns(Promise.resolve(returnValue));

      const result = await storiesController.getStories(skip, take, show, ask, userId);

      sinon.assert.calledOnce(getAllSpy);
      sinon.assert.calledWithExactly(getAllSpy, skip, take, show, ask, userId);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult(returnValue));
    });

    it('it should return a WarningResult correctly', async() => {
      const returnValue = null;
      const skip = 0;
      const take = 10;
      const show = false;
      const ask = false;
      const userId = 'userIdMock';
      getAllSpy.returns(Promise.resolve(returnValue));

      const result = await storiesController.getStories(skip, take, show, ask, userId);

      sinon.assert.calledOnce(getAllSpy);
      sinon.assert.calledWithExactly(getAllSpy, skip, take, show, ask, userId);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.NO_STORIES_WARNING));
    });

  });

  describe('# getStoriesChrono', () => {
    let getAllChronoSpy;

    beforeEach(() => {
      getAllChronoSpy = sinon.stub(managerMock, 'getAllChrono');
    });

    afterEach(() => {
      getAllChronoSpy.restore();
    });

    it('it should return an ApiResult correctly', async() => {
      const returnValue = [{ }];
      const skip = 0;
      const take = 10;
      const show = false;
      const ask = false;
      const userId = 'userIdMock';
      getAllChronoSpy.returns(Promise.resolve(returnValue));

      const result = await storiesController.getStoriesChrono(skip, take, show, ask, userId);

      sinon.assert.calledOnce(getAllChronoSpy);
      sinon.assert.calledWithExactly(getAllChronoSpy, skip, take, show, ask, userId);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult(returnValue));
    });

    it('it should return a WarningResult correctly', async() => {
      const returnValue = null;
      const skip = 0;
      const take = 10;
      const show = false;
      const ask = false;
      const userId = 'userIdMock';
      getAllChronoSpy.returns(Promise.resolve(returnValue));

      const result = await storiesController.getStoriesChrono(skip, take, show, ask, userId);

      sinon.assert.calledOnce(getAllChronoSpy);
      sinon.assert.calledWithExactly(getAllChronoSpy, skip, take, show, ask, userId);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.NO_STORIES_WARNING));
    });

  });

  describe('# deleteStory', () => {
    let findOneStrictSpy;
    let deleteOneSpy;

    beforeEach(() => {
      findOneStrictSpy = sinon.stub(managerMock, 'findOneStrict');
      deleteOneSpy = sinon.stub(managerMock, 'deleteOne');
    });

    afterEach(() => {
      findOneStrictSpy.restore();
      deleteOneSpy.restore();
    });

    it('it should return an OkResult correctly', async() => {
      const userId = 'userIdMock';
      const storyId = 'storyIdMock';
      const returnValue = { result: { ok: true }, deletedCount: 1 };
      const storyValue = { user_id: userId };
      findOneStrictSpy.returns(Promise.resolve(storyValue));
      deleteOneSpy.returns(Promise.resolve(returnValue));

      const result = await storiesController.deleteStory(userId, storyId);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
      sinon.assert.calledOnce(deleteOneSpy);
      sinon.assert.calledWithExactly(deleteOneSpy, storyId);
      expect(findOneStrictSpy.calledBefore(deleteOneSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.DELETE_STORY_INFO));
    });

    it('it should throw a NotFoundError in case of missing story', async() => {
      const userId = 'userIdMock';
      const storyId = 'storyIdMock';
      const returnValue = { result: { ok: true }, deletedCount: 1 };
      const storyValue = null;
      findOneStrictSpy.returns(Promise.resolve(storyValue));
      deleteOneSpy.returns(Promise.resolve(returnValue));

      try {
        await storiesController.deleteStory(userId, storyId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.STORY_NOT_FOUND));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.notCalled(deleteOneSpy);
      }
    });

    it('it should throw a ForbiddenError in case of user mismatch', async() => {
      const userId = 'userIdMock';
      const storyId = 'storyIdMock';
      const returnValue = { result: { ok: true }, deletedCount: 1 };
      const storyValue = { user_id: userId + 'different' };
      findOneStrictSpy.returns(Promise.resolve(storyValue));
      deleteOneSpy.returns(Promise.resolve(returnValue));

      try {
        await storiesController.deleteStory(userId, storyId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ForbiddenError(Errors.FORBIDDEN_DELETE_STORY_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.notCalled(deleteOneSpy);
      }
    });

    it('it should throw an ApiError in case of delete error', async() => {
      const userId = 'userIdMock';
      const storyId = 'storyIdMock';
      const returnValue = { result: { ok: false }, deletedCount: 1 };
      const storyValue = { user_id: userId };
      findOneStrictSpy.returns(Promise.resolve(storyValue));
      deleteOneSpy.returns(Promise.resolve(returnValue));

      try {
        await storiesController.deleteStory(userId, storyId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.DELETE_STORY_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.calledOnce(deleteOneSpy);
        sinon.assert.calledWithExactly(deleteOneSpy, storyId);
        expect(findOneStrictSpy.calledBefore(deleteOneSpy)).to.be.true;
      }
    });

    it('it should throw an ApiError in case of delete error (no delete)', async() => {
      const userId = 'userIdMock';
      const storyId = 'storyIdMock';
      const returnValue = { result: { ok: true }, deletedCount: 0 };
      const storyValue = { user_id: userId };
      findOneStrictSpy.returns(Promise.resolve(storyValue));
      deleteOneSpy.returns(Promise.resolve(returnValue));

      try {
        await storiesController.deleteStory(userId, storyId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.DELETE_STORY_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.calledOnce(deleteOneSpy);
        sinon.assert.calledWithExactly(deleteOneSpy, storyId);
        expect(findOneStrictSpy.calledBefore(deleteOneSpy)).to.be.true;
      }
    });

  });

  describe('# create', () => {
    let createSpy;

    beforeEach(() => {
      createSpy = sinon.stub(managerMock, 'create');
    });

    afterEach(() => {
      createSpy.restore();
    });

    it('it should return an InsertResult correctly', async() => {
      const userId = 'userIdMock';
      const story = { title: 'titlemock', text: 'textmock', url: '' };
      const returnValue = { result: { ok: true }, insertedCount: 1, insertedId: 111 };
      createSpy.returns(Promise.resolve(returnValue));

      const result = await storiesController.create(userId, story);

      sinon.assert.calledOnce(createSpy);
      sinon.assert.calledWithExactly(createSpy, userId, story.title, story.text, story.url);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new InsertResult(Infos.CREATE_STORY_INFO, returnValue.insertedId));
    });

    it('it should throw a BadRequestError if both text and URL are provided', async() => {
      const userId = 'userIdMock';
      const story = { title: 'titlemock', text: 'textmock', url: 'mockulr' };
      const returnValue = { result: { ok: true }, insertedCount: 1, insertedId: 111 };
      createSpy.returns(Promise.resolve(returnValue));

      try {
        await storiesController.create(userId, story);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new BadRequestError(Errors.CREATE_STORY_TOO_MANY_INFO_ERROR));
      } finally {
        sinon.assert.notCalled(createSpy);
      }
    });

    it('it should throw a BadRequestError correctly (missing param)', async() => {
      const userId = 'userIdMock';
      const story = { title: 'titlemock' };
      const returnValue = { result: { ok: true }, insertedCount: 1, insertedId: 111 };
      createSpy.returns(Promise.resolve(returnValue));

      try {
        await storiesController.create(userId, story);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new BadRequestError(Errors.CREATE_STORY_INPUT_ERROR));
      } finally {
        sinon.assert.notCalled(createSpy);
      }
    });

    it('it should throw an ApiError correctly (not created)', async() => {
      const userId = 'userIdMock';
      const story = { title: 'titlemock', text: 'textmock', url: '' };
      const returnValue = { result: { ok: false }, insertedCount: 1, insertedId: 111 };
      createSpy.returns(Promise.resolve(returnValue));

      try {
        await storiesController.create(userId, story);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.CREATE_STORY_ERROR));
      } finally {
        sinon.assert.calledOnce(createSpy);
        sinon.assert.calledWithExactly(createSpy, userId, story.title, story.text, story.url);
      }
    });

    it('it should throw an ApiError correctly (not created - insertedCount)', async() => {
      const userId = 'userIdMock';
      const story = { title: 'titlemock', text: 'textmock', url: '' };
      const returnValue = { result: { ok: true }, insertedCount: 0, insertedId: 111 };
      createSpy.returns(Promise.resolve(returnValue));

      try {
        await storiesController.create(userId, story);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.CREATE_STORY_ERROR));
      } finally {
        sinon.assert.calledOnce(createSpy);
        sinon.assert.calledWithExactly(createSpy, userId, story.title, story.text, story.url);
      }
    });

    it('it should throw an ApiError correctly (not created - insertedCount)', async() => {
      const userId = 'userIdMock';
      const story = { title: 'titlemock', text: 'textmock', url: '' };
      createSpy.returns(Promise.reject(new MongoError('mockMessage')));

      try {
        await storiesController.create(userId, story);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.CREATE_STORY_ERROR));
      } finally {
        sinon.assert.calledOnce(createSpy);
        sinon.assert.calledWithExactly(createSpy, userId, story.title, story.text, story.url);
      }
    });

  });

});
