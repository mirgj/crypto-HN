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
  findOneByUserIdObjectId: () => { },
};

const storiesManagerMock = {
  findOneStrict: () => { },
  incrementVote: () => { },
};

const usersManagerMock = {
  incrementVote: () => { },
};

const commentsManagerMock = {

};

const helperMock = {

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

});
