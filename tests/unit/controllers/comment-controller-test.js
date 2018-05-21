import { expect } from 'chai';
import { Errors, Warnings, Infos } from '../../../src/constants/index';
import { ApiResult, WarningResult, InsertResult, OkResult } from '../../../src/results/api-data';
import { NotFoundError, ApiError, ForbiddenError } from '../../../src/results/api-errors';
import { logger } from '../../../src/helpers/logger';
import { __Rewire__ } from '../../../src/controllers/comments-controller';
import sinon from 'sinon';
import * as commentsController from '../../../src/controllers/comments-controller';

const managerMock = {
  getAllChrono: () => { },
  getAllByStory: () => { },
  findOne: () => { },
  create: () => { },
  update: () => { },
};
const storyManagerMock = {
  findOne: () => { },
};
const helperMock = {
  treefy: () => { },
  subtree: () => { },
};

describe('## controllers/comments-controller.js unit tests', () => {

  before(() => {
    logger.transports[0].level = 'error';

    __Rewire__('manager', managerMock);
    __Rewire__('storyManager', storyManagerMock);
    __Rewire__('helper', helperMock);
  });

  describe('# getAllComments', () => {
    let getAllChronoSpy;

    beforeEach(() => {
      getAllChronoSpy = sinon.stub(managerMock, 'getAllChrono');
    });

    afterEach(() => {
      getAllChronoSpy.restore();
    });

    it('it should return an ApiResult correctly', async() => {
      const returnValue = [{ }];
      getAllChronoSpy.returns(Promise.resolve(returnValue));

      const result = await commentsController.getAllComments(0, 10);

      sinon.assert.calledOnce(getAllChronoSpy);
      sinon.assert.calledWithExactly(getAllChronoSpy, 0, 10, undefined);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult(returnValue));
    });

    it('it should return an ApiResult correctly', async() => {
      const returnValue = [{ }];
      getAllChronoSpy.returns(Promise.resolve(returnValue));

      const result = await commentsController.getAllComments(0, 10, 'mockuserid');

      sinon.assert.calledOnce(getAllChronoSpy);
      sinon.assert.calledWithExactly(getAllChronoSpy, 0, 10, 'mockuserid');
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult(returnValue));
    });

    it('it should return a WarningResult in case of empty query', async() => {
      const returnValue = null;
      getAllChronoSpy.returns(Promise.resolve(returnValue));

      const result = await commentsController.getAllComments(0, 10);

      sinon.assert.calledOnce(getAllChronoSpy);
      sinon.assert.calledWithExactly(getAllChronoSpy, 0, 10, undefined);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.NO_COMMENTS_WARNING_ALL));
    });

  });

  describe('# getStoryComments', () => {
    let getAllByStorySpy;
    let treefySpy;
    let subtreeSpy;

    beforeEach(() => {
      getAllByStorySpy = sinon.stub(managerMock, 'getAllByStory');
      treefySpy = sinon.stub(helperMock, 'treefy');
      subtreeSpy = sinon.stub(helperMock, 'subtree');
    });

    afterEach(() => {
      getAllByStorySpy.restore();
      treefySpy.restore();
      subtreeSpy.restore();
    });

    it('it should return an ApiResult correctly', async() => {
      const returnValue = [{ }];
      const treefyReturn = [{ a: 'b' }];
      getAllByStorySpy.returns(Promise.resolve(returnValue));
      treefySpy.returns(treefyReturn);

      const result = await commentsController.getStoryComments('mockstoryid');

      sinon.assert.calledOnce(getAllByStorySpy);
      sinon.assert.calledWithExactly(getAllByStorySpy, 'mockstoryid');
      sinon.assert.calledOnce(treefySpy);
      sinon.assert.calledWithExactly(treefySpy, returnValue);
      expect(getAllByStorySpy.calledBefore(treefySpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult(treefyReturn));
    });

    it('it should return an ApiResult correctly (calling subtree)', async() => {
      const returnValue = [{ }];
      const treefyReturn = [{ a: 'b' }];
      const subtreeReturn = [{ a: 'b', q: 't' }];
      getAllByStorySpy.returns(Promise.resolve(returnValue));
      treefySpy.returns(treefyReturn);
      subtreeSpy.returns(subtreeReturn);

      const result = await commentsController.getStoryComments('mockstoryid', 'mockcommentid');

      sinon.assert.calledOnce(getAllByStorySpy);
      sinon.assert.calledWithExactly(getAllByStorySpy, 'mockstoryid');
      sinon.assert.calledOnce(treefySpy);
      sinon.assert.calledOnce(subtreeSpy);
      sinon.assert.calledWithExactly(treefySpy, returnValue);
      sinon.assert.calledWithExactly(subtreeSpy, treefyReturn, 'mockcommentid');
      expect(getAllByStorySpy.calledBefore(treefySpy)).to.be.true;
      expect(treefySpy.calledBefore(subtreeSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult(subtreeReturn));
    });

    it('it should return a WarningResult in case of empty query', async() => {
      const returnValue = null;
      getAllByStorySpy.returns(Promise.resolve(returnValue));
      treefySpy.returns(returnValue);

      const result = await commentsController.getStoryComments('mockstoryid');

      sinon.assert.calledOnce(getAllByStorySpy);
      sinon.assert.calledWithExactly(getAllByStorySpy, 'mockstoryid');
      sinon.assert.notCalled(treefySpy);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.NO_COMMENTS_WARNING, []));
    });

  });

  describe('# createForStory', () => {
    let findOneSpy;
    let createSpy;

    beforeEach(() => {
      findOneSpy = sinon.stub(storyManagerMock, 'findOne');
      createSpy = sinon.stub(managerMock, 'create');
    });

    afterEach(() => {
      findOneSpy.restore();
      createSpy.restore();
    });

    it('it should return an InsertResult correctly', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      const text = 'mocktext';
      const parentCommentId = 'mockparentcommentid';
      const returnValue = { };
      const createReturn = { result: { ok: true}, insertedCount: 1, insertedId: 100 };
      findOneSpy.returns(Promise.resolve(returnValue));
      createSpy.returns(Promise.resolve(createReturn));

      const result = await commentsController.createForStory(userId, storyId, text, parentCommentId);

      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWithExactly(findOneSpy, storyId);
      sinon.assert.calledOnce(createSpy);
      sinon.assert.calledWithExactly(createSpy, userId, storyId, text, parentCommentId);
      expect(findOneSpy.calledBefore(createSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new InsertResult(Infos.CREATE_COMMENT_INFO, createReturn.insertedId));
    });

    it('it should return an NotFoundError (story not found)', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      const text = 'mocktext';
      const parentCommentId = 'mockparentcommentid';
      const returnValue = null;
      const createReturn = { result: { ok: true}, insertedCount: 1, insertedId: 100 };
      findOneSpy.returns(Promise.resolve(returnValue));
      createSpy.returns(Promise.resolve(createReturn));

      try {
        await commentsController.createForStory(userId, storyId, text, parentCommentId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.STORY_NOT_FOUND));
      } finally {
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWithExactly(findOneSpy, storyId);
        sinon.assert.notCalled(createSpy);
      }

    });

    it('it should return an ApiError (error creating the comment)', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      const text = 'mocktext';
      const parentCommentId = 'mockparentcommentid';
      const returnValue = {};
      const createReturn = { result: { ok: false }, insertedCount: 1, insertedId: 100 };
      findOneSpy.returns(Promise.resolve(returnValue));
      createSpy.returns(Promise.resolve(createReturn));

      try {
        await commentsController.createForStory(userId, storyId, text, parentCommentId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.CREATE_COMMENT_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWithExactly(findOneSpy, storyId);
        sinon.assert.calledOnce(createSpy);
        sinon.assert.calledWithExactly(createSpy, userId, storyId, text, parentCommentId);
        expect(findOneSpy.calledBefore(createSpy)).to.be.true;
      }

    });

    it('it should return an ApiError (error creating the comment)', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      const text = 'mocktext';
      const parentCommentId = 'mockparentcommentid';
      const returnValue = {};
      const createReturn = { result: { ok: true }, insertedCount: 0, insertedId: 100 };
      findOneSpy.returns(Promise.resolve(returnValue));
      createSpy.returns(Promise.resolve(createReturn));

      try {
        await commentsController.createForStory(userId, storyId, text, parentCommentId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.CREATE_COMMENT_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWithExactly(findOneSpy, storyId);
        sinon.assert.calledOnce(createSpy);
        sinon.assert.calledWithExactly(createSpy, userId, storyId, text, parentCommentId);
        expect(findOneSpy.calledBefore(createSpy)).to.be.true;
      }

    });

  });

  describe('# update', () => {
    let findOneSpy;
    let updateSpy;

    beforeEach(() => {
      findOneSpy = sinon.stub(managerMock, 'findOne');
      updateSpy = sinon.stub(managerMock, 'update');
    });

    afterEach(() => {
      findOneSpy.restore();
      updateSpy.restore();
    });

    it('it should return an OkResult correctly', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentId';
      const text = 'mocktext';
      const returnValue = { user_id: userId };
      const createReturn = { result: { ok: true} };
      findOneSpy.returns(Promise.resolve(returnValue));
      updateSpy.returns(Promise.resolve(createReturn));

      const result = await commentsController.update(userId, commentId, text);

      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWithExactly(findOneSpy, commentId);
      sinon.assert.calledOnce(updateSpy);
      sinon.assert.calledWithExactly(updateSpy, commentId, text, undefined);
      expect(findOneSpy.calledBefore(updateSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.UPDATE_COMMENT_INFO));
    });

    it('it should return an NotFoundError', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentId';
      const text = 'mocktext';
      const returnValue = { user_id: userId + 'fake' };
      const createReturn = { result: { ok: true} };
      findOneSpy.returns(Promise.resolve(returnValue));
      updateSpy.returns(Promise.resolve(createReturn));

      try {
        await commentsController.update(userId, commentId, text);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ForbiddenError(Errors.FORBIDDEN_UPDATE_COMMENT_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWithExactly(findOneSpy, commentId);
        sinon.assert.notCalled(updateSpy);
      }

    });

    it('it should return an ApiError', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentId';
      const text = 'mocktext';
      const returnValue = { user_id: userId };
      const createReturn = { result: { ok: false} };
      findOneSpy.returns(Promise.resolve(returnValue));
      updateSpy.returns(Promise.resolve(createReturn));

      try {
        await commentsController.update(userId, commentId, text);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.UPDATE_COMMENT_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWithExactly(findOneSpy, commentId);
        sinon.assert.calledOnce(updateSpy);
        sinon.assert.calledWithExactly(updateSpy, commentId, text, undefined);
        expect(findOneSpy.calledBefore(updateSpy)).to.be.true;
      }

    });

  });

  describe('# update (with delete flag)', () => {
    let findOneSpy;
    let updateSpy;

    beforeEach(() => {
      findOneSpy = sinon.stub(managerMock, 'findOne');
      updateSpy = sinon.stub(managerMock, 'update');
    });

    afterEach(() => {
      findOneSpy.restore();
      updateSpy.restore();
    });

    it('it should return an OkResult correctly', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentId';
      const text = 'mocktext';
      const returnValue = { user_id: userId };
      const createReturn = { result: { ok: true} };
      findOneSpy.returns(Promise.resolve(returnValue));
      updateSpy.returns(Promise.resolve(createReturn));

      const result = await commentsController.update(userId, commentId, text, true);

      sinon.assert.calledOnce(findOneSpy);
      sinon.assert.calledWithExactly(findOneSpy, commentId);
      sinon.assert.calledOnce(updateSpy);
      sinon.assert.calledWithExactly(updateSpy, commentId, text, true);
      expect(findOneSpy.calledBefore(updateSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.DELETE_COMMENT_INFO));
    });

    it('it should return an NotFoundError', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentId';
      const text = 'mocktext';
      const returnValue = { user_id: userId + 'fake' };
      const createReturn = { result: { ok: true} };
      findOneSpy.returns(Promise.resolve(returnValue));
      updateSpy.returns(Promise.resolve(createReturn));

      try {
        await commentsController.update(userId, commentId, text, true);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ForbiddenError(Errors.FORBIDDEN_DELETE_COMMENT_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWithExactly(findOneSpy, commentId);
        sinon.assert.notCalled(updateSpy);
      }

    });

    it('it should return an ApiError', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentId';
      const text = 'mocktext';
      const returnValue = { user_id: userId };
      const createReturn = { result: { ok: false} };
      findOneSpy.returns(Promise.resolve(returnValue));
      updateSpy.returns(Promise.resolve(createReturn));

      try {
        await commentsController.update(userId, commentId, text, true);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.DELETE_COMMENT_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneSpy);
        sinon.assert.calledWithExactly(findOneSpy, commentId);
        sinon.assert.calledOnce(updateSpy);
        sinon.assert.calledWithExactly(updateSpy, commentId, text, true);
        expect(findOneSpy.calledBefore(updateSpy)).to.be.true;
      }

    });

  });

});
