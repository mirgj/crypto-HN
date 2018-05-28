import { expect } from 'chai';
import { Errors, Warnings, Infos, Commons, Collections } from '../../../src/constants/index';
import { OkResult, WarningResult } from '../../../src/results/api-data';
import { ApiError, NotFoundError } from '../../../src/results/api-errors';
import { logger } from '../../../src/helpers/logger';
import { __Rewire__ } from '../../../src/controllers/votes-controller';
import config from '../../../config';
import sinon from 'sinon';
import * as votesController from '../../../src/controllers/votes-controller';

const managerMock = {
  create: () => { },
  deleteOne: () => { },
  findOneByUserIdObjectId: () => { },
  findByUserAndIdsRange: () => { },
};

const storiesManagerMock = {
  findOneStrict: () => { },
  incrementVote: () => { },
};

const usersManagerMock = {
  incrementVote: () => { },
};

const commentsManagerMock = {
  findOne: () => { },
  incrementVote: () => { },
};

const helperMock = {
  calculateMinAndMaxIds: () => { },
};

describe('## controllers/votes-controller.js unit tests', () => {

  before(() => {
    logger.transports[0].level = 'error';

    __Rewire__('manager', managerMock);
    __Rewire__('storiesManager', storiesManagerMock);
    __Rewire__('usersManager', usersManagerMock);
    __Rewire__('commentsManager', commentsManagerMock);
    __Rewire__('helper', helperMock);
  });

  describe('# voteStory', () => {
    let findOneStrictSpy;
    let incrementVoteSpy;
    let usersIncrementVoteSpy;
    let findOneByUserIdObjectIdSpy;
    let createSpy;

    beforeEach(() => {
      findOneStrictSpy = sinon.stub(storiesManagerMock, 'findOneStrict');
      incrementVoteSpy = sinon.stub(storiesManagerMock, 'incrementVote');
      usersIncrementVoteSpy = sinon.stub(usersManagerMock, 'incrementVote');
      findOneByUserIdObjectIdSpy = sinon.stub(managerMock, 'findOneByUserIdObjectId');
      createSpy = sinon.stub(managerMock, 'create');
    });

    afterEach(() => {
      findOneStrictSpy.restore();
      incrementVoteSpy.restore();
      usersIncrementVoteSpy.restore();
      findOneByUserIdObjectIdSpy.restore();
      createSpy.restore();
    });

    it('it should vote the story and return an OkResult', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const storyId = 'mockstoryid';
      const direction = Commons.Up;
      const story = { user_id: 'anotheruserid' };
      const incrementVote = { result: {ok: true}, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));
      usersIncrementVoteSpy.returns(Promise.resolve(incrementVote));
      createSpy.returns(Promise.resolve(true));

      const result = await votesController.voteStory(userId, userkarma, storyId, direction);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.calledOnce(incrementVoteSpy);
      sinon.assert.calledOnce(usersIncrementVoteSpy);
      sinon.assert.calledOnce(createSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
      sinon.assert.calledWithExactly(incrementVoteSpy, storyId, 1);
      sinon.assert.calledWithExactly(usersIncrementVoteSpy, story.user_id, 1);
      sinon.assert.calledWithExactly(createSpy, userId, storyId, Collections.Stories, direction);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(incrementVoteSpy.calledBefore(usersIncrementVoteSpy)).to.be.true;
      expect(usersIncrementVoteSpy.calledBefore(createSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.CREATE_VOTE_OK));
    });

    it('it should vote the story and return an OkResult (downvote)', async() => {
      const userId = 'mockuserid';
      const userkarma = config.defaultValues.minKarmaForDownvote + 10;
      const storyId = 'mockstoryid';
      const direction = Commons.Down;
      const story = { user_id: 'anotheruserid' };
      const incrementVote = { result: {ok: true}, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));
      usersIncrementVoteSpy.returns(Promise.resolve(incrementVote));
      createSpy.returns(Promise.resolve(true));

      const result = await votesController.voteStory(userId, userkarma, storyId, direction);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.calledOnce(incrementVoteSpy);
      sinon.assert.calledOnce(usersIncrementVoteSpy);
      sinon.assert.calledOnce(createSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
      sinon.assert.calledWithExactly(incrementVoteSpy, storyId, -1);
      sinon.assert.calledWithExactly(usersIncrementVoteSpy, story.user_id, -1);
      sinon.assert.calledWithExactly(createSpy, userId, storyId, Collections.Stories, direction);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(incrementVoteSpy.calledBefore(usersIncrementVoteSpy)).to.be.true;
      expect(usersIncrementVoteSpy.calledBefore(createSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.CREATE_VOTE_OK));
    });

    it('it should throw a NotFoundError because of missed story', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const storyId = 'mockstoryid';
      const direction = Commons.Up;
      findOneStrictSpy.returns(Promise.resolve(null));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));

      try {
        await votesController.voteStory(userId, userkarma, storyId, direction);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.STORY_NOT_FOUND));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.notCalled(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(createSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

    it('it should return a WarningResult (user can\'t vote his story)', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const storyId = 'mockstoryid';
      const direction = Commons.Up;
      const story = { user_id: userId };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));

      const result = await votesController.voteStory(userId, userkarma, storyId, direction);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.notCalled(incrementVoteSpy);
      sinon.assert.notCalled(usersIncrementVoteSpy);
      sinon.assert.notCalled(createSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.CANT_VOTE_YOUR_STORY));
    });

    it('it should return a WarningResult (story already voted by the user)', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const storyId = 'mockstoryid';
      const direction = Commons.Up;
      const story = { user_id: 'anotheruserid' };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve({ }));

      const result = await votesController.voteStory(userId, userkarma, storyId, direction);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.notCalled(incrementVoteSpy);
      sinon.assert.notCalled(usersIncrementVoteSpy);
      sinon.assert.notCalled(createSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.ALREADY_VOTED_WARNING));
    });

    it('it should return a WarningResult (not enough karma for downvote)', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const storyId = 'mockstoryid';
      const direction = Commons.Down;
      const story = { user_id: 'anotheruserid' };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));

      const result = await votesController.voteStory(userId, userkarma, storyId, direction);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.notCalled(incrementVoteSpy);
      sinon.assert.notCalled(usersIncrementVoteSpy);
      sinon.assert.notCalled(createSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.NOT_ENOUGH_KARMA.split('{0}').join(config.defaultValues.minKarmaForDownvote)));
    });

    it('it should throw an ApiError', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const storyId = 'mockstoryid';
      const direction = Commons.Up;
      const story = { user_id: 'anotheruserid' };
      const incrementVote = { result: {ok: false}, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));

      try {
        await votesController.voteStory(userId, userkarma, storyId, direction);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.VOTE_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.calledOnce(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(createSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
        sinon.assert.calledWithExactly(incrementVoteSpy, storyId, 1);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

    it('it should throw an ApiError (not modified)', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const storyId = 'mockstoryid';
      const direction = Commons.Up;
      const story = { user_id: 'anotheruserid' };
      const incrementVote = { result: {ok: true }, modifiedCount: 0 };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));

      try {
        await votesController.voteStory(userId, userkarma, storyId, direction);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.VOTE_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.calledOnce(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(createSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
        sinon.assert.calledWithExactly(incrementVoteSpy, storyId, 1);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

  });

  describe('# unvoteStory', () => {
    let findOneStrictSpy;
    let incrementVoteSpy;
    let usersIncrementVoteSpy;
    let findOneByUserIdObjectIdSpy;
    let deleteOneSpy;

    beforeEach(() => {
      findOneStrictSpy = sinon.stub(storiesManagerMock, 'findOneStrict');
      incrementVoteSpy = sinon.stub(storiesManagerMock, 'incrementVote');
      usersIncrementVoteSpy = sinon.stub(usersManagerMock, 'incrementVote');
      findOneByUserIdObjectIdSpy = sinon.stub(managerMock, 'findOneByUserIdObjectId');
      deleteOneSpy = sinon.stub(managerMock, 'deleteOne');
    });

    afterEach(() => {
      findOneStrictSpy.restore();
      incrementVoteSpy.restore();
      usersIncrementVoteSpy.restore();
      findOneByUserIdObjectIdSpy.restore();
      deleteOneSpy.restore();
    });

    it('it should unvote the story and return an OkResult', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      const story = { user_id: 'anotheruserid' };
      const vote = { vote_direction: Commons.Up };
      const incrementVote = { result: {ok: true}, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(vote));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));
      usersIncrementVoteSpy.returns(Promise.resolve(incrementVote));
      deleteOneSpy.returns(Promise.resolve(true));

      const result = await votesController.unvoteStory(userId, storyId);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.calledOnce(incrementVoteSpy);
      sinon.assert.calledOnce(usersIncrementVoteSpy);
      sinon.assert.calledOnce(deleteOneSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
      sinon.assert.calledWithExactly(incrementVoteSpy, storyId, -1);
      sinon.assert.calledWithExactly(usersIncrementVoteSpy, story.user_id, -1);
      sinon.assert.calledWithExactly(deleteOneSpy, userId, storyId, Collections.Stories);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(incrementVoteSpy.calledBefore(usersIncrementVoteSpy)).to.be.true;
      expect(usersIncrementVoteSpy.calledBefore(deleteOneSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.CREATE_UNVOTE_OK));
    });

    it('it should unvote the story and return an OkResult (downvote)', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      const story = { user_id: 'anotheruserid' };
      const vote = { vote_direction: Commons.Down };
      const incrementVote = { result: {ok: true}, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(vote));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));
      usersIncrementVoteSpy.returns(Promise.resolve(incrementVote));
      deleteOneSpy.returns(Promise.resolve(true));

      const result = await votesController.unvoteStory(userId, storyId);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.calledOnce(incrementVoteSpy);
      sinon.assert.calledOnce(usersIncrementVoteSpy);
      sinon.assert.calledOnce(deleteOneSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
      sinon.assert.calledWithExactly(incrementVoteSpy, storyId, 1);
      sinon.assert.calledWithExactly(usersIncrementVoteSpy, story.user_id, 1);
      sinon.assert.calledWithExactly(deleteOneSpy, userId, storyId, Collections.Stories);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(incrementVoteSpy.calledBefore(usersIncrementVoteSpy)).to.be.true;
      expect(usersIncrementVoteSpy.calledBefore(deleteOneSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.CREATE_UNVOTE_OK));
    });

    it('it should throw a NotFoundError (vote not found)', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      const story = { user_id: 'anotheruserid' };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));

      try {
        await votesController.unvoteStory(userId, storyId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.NOT_VOTE_FOUND_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.notCalled(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(deleteOneSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

    it('it should throw a NotFoundError (story not found)', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      findOneStrictSpy.returns(Promise.resolve(null));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve({}));

      try {
        await votesController.unvoteStory(userId, storyId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.STORY_NOT_FOUND));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.notCalled(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(deleteOneSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

    it('it should throw a WarningResult (can\'t unvote your story)', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      const story = { user_id: userId };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve({}));

      const result = await votesController.unvoteStory(userId, storyId);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.notCalled(incrementVoteSpy);
      sinon.assert.notCalled(usersIncrementVoteSpy);
      sinon.assert.notCalled(deleteOneSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.CANT_VOTE_YOUR_STORY));
    });

    it('it should throw ApiError when the update has not executed correctly', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      const story = { user_id: 'anotheruserid' };
      const vote = { vote_direction: Commons.Up };
      const incrementVote = { result: {ok: false }, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(vote));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));

      try {
        await votesController.unvoteStory(userId, storyId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.VOTE_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.calledOnce(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(deleteOneSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
        sinon.assert.calledWithExactly(incrementVoteSpy, storyId, -1);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

    it('it should throw ApiError when the update has not executed correctly (not modified count)', async() => {
      const userId = 'mockuserid';
      const storyId = 'mockstoryid';
      const story = { user_id: 'anotheruserid' };
      const vote = { vote_direction: Commons.Up };
      const incrementVote = { result: {ok: true }, modifiedCount: 0 };
      findOneStrictSpy.returns(Promise.resolve(story));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(vote));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));

      try {
        await votesController.unvoteStory(userId, storyId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.VOTE_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.calledOnce(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(deleteOneSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, storyId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, storyId, Collections.Stories);
        sinon.assert.calledWithExactly(incrementVoteSpy, storyId, -1);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

  });

  describe('# getUserVoteMapping', () => {
    let findByUserAndIdsRangeSpy;
    let calculateMinAndMaxIdsSpy;

    beforeEach(() => {
      findByUserAndIdsRangeSpy = sinon.stub(managerMock, 'findByUserAndIdsRange');
      calculateMinAndMaxIdsSpy = sinon.stub(helperMock, 'calculateMinAndMaxIds');
    });

    afterEach(() => {
      findByUserAndIdsRangeSpy.restore();
      calculateMinAndMaxIdsSpy.restore();
    });

    it('should return an array correctly', async() => {
      const userId = 'mockuserid';
      const obj = {object_id: 'objectId'};
      var expected = [];
      var minMax = { min: 1, max: 2 };
      calculateMinAndMaxIdsSpy.returns(minMax);
      findByUserAndIdsRangeSpy.returns(Promise.resolve([ obj ]));

      const result = await votesController.getUserVoteMapping(userId, [], Collections.Comments);

      expected[obj.object_id] = obj;
      sinon.assert.calledOnce(calculateMinAndMaxIdsSpy);
      sinon.assert.calledWithExactly(calculateMinAndMaxIdsSpy, []);
      sinon.assert.calledOnce(findByUserAndIdsRangeSpy);
      sinon.assert.calledWithExactly(findByUserAndIdsRangeSpy, userId, minMax.min, minMax.max, Collections.Comments);
      expect(calculateMinAndMaxIdsSpy.calledBefore(findByUserAndIdsRangeSpy)).to.be.true;
      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal(expected);
    });

    it('should return an empty array (no min)', async() => {
      const userId = 'mockuserid';
      var minMax = { max: 2 };
      calculateMinAndMaxIdsSpy.returns(minMax);

      const result = await votesController.getUserVoteMapping(userId, [], Collections.Comments);

      sinon.assert.calledOnce(calculateMinAndMaxIdsSpy);
      sinon.assert.calledWithExactly(calculateMinAndMaxIdsSpy, []);
      sinon.assert.notCalled(findByUserAndIdsRangeSpy);
      expect(calculateMinAndMaxIdsSpy.calledBefore(findByUserAndIdsRangeSpy)).to.be.true;
      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([]);
    });

    it('should return an empty array (no max)', async() => {
      const userId = 'mockuserid';
      var minMax = { min: 1 };
      calculateMinAndMaxIdsSpy.returns(minMax);

      const result = await votesController.getUserVoteMapping(userId, [], Collections.Comments);

      sinon.assert.calledOnce(calculateMinAndMaxIdsSpy);
      sinon.assert.calledWithExactly(calculateMinAndMaxIdsSpy, []);
      sinon.assert.notCalled(findByUserAndIdsRangeSpy);
      expect(calculateMinAndMaxIdsSpy.calledBefore(findByUserAndIdsRangeSpy)).to.be.true;
      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([]);
    });

  });

  describe('# getUserStoriesVoteMapping', () => {
    let getUserVoteMappingSpy;
    let calculateMinAndMaxIdsSpy;

    beforeEach(() => {
      getUserVoteMappingSpy = sinon.spy(votesController, 'getUserVoteMapping');
      calculateMinAndMaxIdsSpy = sinon.stub(helperMock, 'calculateMinAndMaxIds');
    });

    afterEach(() => {
      getUserVoteMappingSpy.restore();
      calculateMinAndMaxIdsSpy.restore();
    });

    it('should return an array correctly', async() => {
      const arr = [];
      const userId = 'mockuserid';
      calculateMinAndMaxIdsSpy.returns({});

      const result = await votesController.getUserStoriesVoteMapping(userId, arr);

      // sinon.assert.calledOnce(getUserVoteMappingSpy);
      // sinon.assert.calledWithExactly(getUserVoteMappingSpy, userId, arr, Collections.Stories);
      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal(arr);
    });

  });

  describe('# getUserCommentsVoteMapping', () => {
    let getUserVoteMappingSpy;
    let calculateMinAndMaxIdsSpy;

    beforeEach(() => {
      getUserVoteMappingSpy = sinon.spy(votesController, 'getUserVoteMapping');
      calculateMinAndMaxIdsSpy = sinon.stub(helperMock, 'calculateMinAndMaxIds');
    });

    afterEach(() => {
      getUserVoteMappingSpy.restore();
      calculateMinAndMaxIdsSpy.restore();
    });

    it('should return an array correctly', async() => {
      const arr = [];
      const userId = 'mockuserid';
      calculateMinAndMaxIdsSpy.returns({});

      const result = await votesController.getUserCommentsVoteMapping(userId, arr);

      // sinon.assert.calledOnce(getUserVoteMappingSpy);
      // sinon.assert.calledWithExactly(getUserVoteMappingSpy, userId, arr, Collections.Comments);
      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal(arr);
    });

  });

  describe('# voteComment', () => {
    let findOneStrictSpy;
    let incrementVoteSpy;
    let usersIncrementVoteSpy;
    let findOneByUserIdObjectIdSpy;
    let createSpy;

    beforeEach(() => {
      findOneStrictSpy = sinon.stub(commentsManagerMock, 'findOne');
      incrementVoteSpy = sinon.stub(commentsManagerMock, 'incrementVote');
      usersIncrementVoteSpy = sinon.stub(usersManagerMock, 'incrementVote');
      findOneByUserIdObjectIdSpy = sinon.stub(managerMock, 'findOneByUserIdObjectId');
      createSpy = sinon.stub(managerMock, 'create');
    });

    afterEach(() => {
      findOneStrictSpy.restore();
      incrementVoteSpy.restore();
      usersIncrementVoteSpy.restore();
      findOneByUserIdObjectIdSpy.restore();
      createSpy.restore();
    });

    it('it should vote the comment and return an OkResult', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const commentId = 'mockcommentId';
      const direction = Commons.Up;
      const comment = { user_id: 'anotheruserid' };
      const incrementVote = { result: {ok: true}, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));
      usersIncrementVoteSpy.returns(Promise.resolve(incrementVote));
      createSpy.returns(Promise.resolve(true));

      const result = await votesController.voteComment(userId, userkarma, commentId, direction);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.calledOnce(incrementVoteSpy);
      sinon.assert.calledOnce(usersIncrementVoteSpy);
      sinon.assert.calledOnce(createSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
      sinon.assert.calledWithExactly(incrementVoteSpy, commentId, 1);
      sinon.assert.calledWithExactly(usersIncrementVoteSpy, comment.user_id, 1);
      sinon.assert.calledWithExactly(createSpy, userId, commentId, Collections.Comments, direction);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(incrementVoteSpy.calledBefore(usersIncrementVoteSpy)).to.be.true;
      expect(usersIncrementVoteSpy.calledBefore(createSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.CREATE_VOTE_OK));
    });

    it('it should vote the comment and return an OkResult (downvote)', async() => {
      const userId = 'mockuserid';
      const userkarma = config.defaultValues.minKarmaForDownvote + 10;
      const commentId = 'mockcommentId';
      const direction = Commons.Down;
      const comment = { user_id: 'anotheruserid' };
      const incrementVote = { result: {ok: true}, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));
      usersIncrementVoteSpy.returns(Promise.resolve(incrementVote));
      createSpy.returns(Promise.resolve(true));

      const result = await votesController.voteComment(userId, userkarma, commentId, direction);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.calledOnce(incrementVoteSpy);
      sinon.assert.calledOnce(usersIncrementVoteSpy);
      sinon.assert.calledOnce(createSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
      sinon.assert.calledWithExactly(incrementVoteSpy, commentId, -1);
      sinon.assert.calledWithExactly(usersIncrementVoteSpy, comment.user_id, -1);
      sinon.assert.calledWithExactly(createSpy, userId, commentId, Collections.Comments, direction);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(incrementVoteSpy.calledBefore(usersIncrementVoteSpy)).to.be.true;
      expect(usersIncrementVoteSpy.calledBefore(createSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.CREATE_VOTE_OK));
    });

    it('it should throw a NotFoundError because of missed comment', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const commentId = 'mockcommentId';
      const direction = Commons.Up;
      findOneStrictSpy.returns(Promise.resolve(null));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));

      try {
        await votesController.voteComment(userId, userkarma, commentId, direction);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.COMMENT_NOT_FOUND));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.notCalled(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(createSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

    it('it should return a WarningResult (user can\'t vote his comment)', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const commentId = 'mockcommentId';
      const direction = Commons.Up;
      const comment = { user_id: userId };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));

      const result = await votesController.voteComment(userId, userkarma, commentId, direction);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.notCalled(incrementVoteSpy);
      sinon.assert.notCalled(usersIncrementVoteSpy);
      sinon.assert.notCalled(createSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.CANT_VOTE_YOURSELF));
    });

    it('it should return a WarningResult (comment already voted by the user)', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const commentId = 'mockcommentId';
      const direction = Commons.Up;
      const comment = { user_id: 'anotheruserid' };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve({ }));

      const result = await votesController.voteComment(userId, userkarma, commentId, direction);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.notCalled(incrementVoteSpy);
      sinon.assert.notCalled(usersIncrementVoteSpy);
      sinon.assert.notCalled(createSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.ALREADY_VOTED_WARNING));
    });

    it('it should return a WarningResult (not enough karma for downvote)', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const commentId = 'mockcommentId';
      const direction = Commons.Down;
      const comment = { user_id: 'anotheruserid' };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));

      const result = await votesController.voteComment(userId, userkarma, commentId, direction);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.notCalled(incrementVoteSpy);
      sinon.assert.notCalled(usersIncrementVoteSpy);
      sinon.assert.notCalled(createSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.NOT_ENOUGH_KARMA.split('{0}').join(config.defaultValues.minKarmaForDownvote)));
    });

    it('it should throw an ApiError', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const commentId = 'mockcommentId';
      const direction = Commons.Up;
      const comment = { user_id: 'anotheruserid' };
      const incrementVote = { result: {ok: false}, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));

      try {
        await votesController.voteComment(userId, userkarma, commentId, direction);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.VOTE_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.calledOnce(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(createSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
        sinon.assert.calledWithExactly(incrementVoteSpy, commentId, 1);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

    it('it should throw an ApiError (not modified)', async() => {
      const userId = 'mockuserid';
      const userkarma = 11;
      const commentId = 'mockcommentId';
      const direction = Commons.Up;
      const comment = { user_id: 'anotheruserid' };
      const incrementVote = { result: {ok: true }, modifiedCount: 0 };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));

      try {
        await votesController.voteComment(userId, userkarma, commentId, direction);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.VOTE_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.calledOnce(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(createSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
        sinon.assert.calledWithExactly(incrementVoteSpy, commentId, 1);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

  });

  describe('# unvoteComment', () => {
    let findOneStrictSpy;
    let incrementVoteSpy;
    let usersIncrementVoteSpy;
    let findOneByUserIdObjectIdSpy;
    let deleteOneSpy;

    beforeEach(() => {
      findOneStrictSpy = sinon.stub(commentsManagerMock, 'findOne');
      incrementVoteSpy = sinon.stub(commentsManagerMock, 'incrementVote');
      usersIncrementVoteSpy = sinon.stub(usersManagerMock, 'incrementVote');
      findOneByUserIdObjectIdSpy = sinon.stub(managerMock, 'findOneByUserIdObjectId');
      deleteOneSpy = sinon.stub(managerMock, 'deleteOne');
    });

    afterEach(() => {
      findOneStrictSpy.restore();
      incrementVoteSpy.restore();
      usersIncrementVoteSpy.restore();
      findOneByUserIdObjectIdSpy.restore();
      deleteOneSpy.restore();
    });

    it('it should unvote the comment and return an OkResult', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentid';
      const comment = { user_id: 'anotheruserid' };
      const vote = { vote_direction: Commons.Up };
      const incrementVote = { result: {ok: true}, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(vote));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));
      usersIncrementVoteSpy.returns(Promise.resolve(incrementVote));
      deleteOneSpy.returns(Promise.resolve(true));

      const result = await votesController.unvoteComment(userId, commentId);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.calledOnce(incrementVoteSpy);
      sinon.assert.calledOnce(usersIncrementVoteSpy);
      sinon.assert.calledOnce(deleteOneSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
      sinon.assert.calledWithExactly(incrementVoteSpy, commentId, -1);
      sinon.assert.calledWithExactly(usersIncrementVoteSpy, comment.user_id, -1);
      sinon.assert.calledWithExactly(deleteOneSpy, userId, commentId, Collections.Comments);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(incrementVoteSpy.calledBefore(usersIncrementVoteSpy)).to.be.true;
      expect(usersIncrementVoteSpy.calledBefore(deleteOneSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.CREATE_UNVOTE_OK));
    });

    it('it should unvote the comment and return an OkResult (downvote)', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentid';
      const comment = { user_id: 'anotheruserid' };
      const vote = { vote_direction: Commons.Down };
      const incrementVote = { result: {ok: true}, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(vote));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));
      usersIncrementVoteSpy.returns(Promise.resolve(incrementVote));
      deleteOneSpy.returns(Promise.resolve(true));

      const result = await votesController.unvoteComment(userId, commentId);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.calledOnce(incrementVoteSpy);
      sinon.assert.calledOnce(usersIncrementVoteSpy);
      sinon.assert.calledOnce(deleteOneSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
      sinon.assert.calledWithExactly(incrementVoteSpy, commentId, 1);
      sinon.assert.calledWithExactly(usersIncrementVoteSpy, comment.user_id, 1);
      sinon.assert.calledWithExactly(deleteOneSpy, userId, commentId, Collections.Comments);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(incrementVoteSpy.calledBefore(usersIncrementVoteSpy)).to.be.true;
      expect(usersIncrementVoteSpy.calledBefore(deleteOneSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new OkResult(Infos.CREATE_UNVOTE_OK));
    });

    it('it should throw a NotFoundError (vote not found)', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentid';
      const comment = { user_id: 'anotheruserid' };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(null));

      try {
        await votesController.unvoteComment(userId, commentId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.NOT_VOTE_FOUND_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.notCalled(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(deleteOneSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

    it('it should throw a NotFoundError (comment not found)', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentid';
      findOneStrictSpy.returns(Promise.resolve(null));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve({}));

      try {
        await votesController.unvoteComment(userId, commentId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new NotFoundError(Errors.COMMENT_NOT_FOUND));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.notCalled(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(deleteOneSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

    it('it should throw a WarningResult (can\'t unvote your comment)', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentid';
      const comment = { user_id: userId };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve({}));

      const result = await votesController.unvoteComment(userId, commentId);

      sinon.assert.calledOnce(findOneStrictSpy);
      sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
      sinon.assert.notCalled(incrementVoteSpy);
      sinon.assert.notCalled(usersIncrementVoteSpy);
      sinon.assert.notCalled(deleteOneSpy);
      sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
      sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
      expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
      expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.CANT_VOTE_YOURSELF));
    });

    it('it should throw ApiError when the update has not executed correctly', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentid';
      const comment = { user_id: 'anotheruserid' };
      const vote = { vote_direction: Commons.Up };
      const incrementVote = { result: {ok: false }, modifiedCount: 1 };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(vote));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));

      try {
        await votesController.unvoteComment(userId, commentId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.VOTE_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.calledOnce(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(deleteOneSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
        sinon.assert.calledWithExactly(incrementVoteSpy, commentId, -1);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

    it('it should throw ApiError when the update has not executed correctly (not modified count)', async() => {
      const userId = 'mockuserid';
      const commentId = 'mockcommentid';
      const comment = { user_id: 'anotheruserid' };
      const vote = { vote_direction: Commons.Up };
      const incrementVote = { result: {ok: true }, modifiedCount: 0 };
      findOneStrictSpy.returns(Promise.resolve(comment));
      findOneByUserIdObjectIdSpy.returns(Promise.resolve(vote));
      incrementVoteSpy.returns(Promise.resolve(incrementVote));

      try {
        await votesController.unvoteComment(userId, commentId);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ApiError(Errors.VOTE_ERROR));
      } finally {
        sinon.assert.calledOnce(findOneStrictSpy);
        sinon.assert.calledOnce(findOneByUserIdObjectIdSpy);
        sinon.assert.calledOnce(incrementVoteSpy);
        sinon.assert.notCalled(usersIncrementVoteSpy);
        sinon.assert.notCalled(deleteOneSpy);
        sinon.assert.calledWithExactly(findOneStrictSpy, commentId);
        sinon.assert.calledWithExactly(findOneByUserIdObjectIdSpy, userId, commentId, Collections.Comments);
        sinon.assert.calledWithExactly(incrementVoteSpy, commentId, -1);
        expect(findOneStrictSpy.calledBefore(findOneByUserIdObjectIdSpy)).to.be.true;
        expect(findOneByUserIdObjectIdSpy.calledBefore(incrementVoteSpy)).to.be.true;
      }
    });

  });

});
