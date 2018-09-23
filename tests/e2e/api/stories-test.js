import { ObjectID } from 'mongodb';
import { expect } from 'chai';
import { logger } from '../../../src/helpers/logger';
import { Collections, Errors, ErrorsCode, HttpStatus, Warnings, Infos } from '../../../src/constants';
import { OkResult, WarningResult } from '../../../src/results/api-data';
import { UnauthorizedError, NotFoundError, ForbiddenError } from '../../../src/results/api-errors';
import request from 'supertest-as-promised';
import config from '../../../config';
import * as db from '../../../src/db/connector';

const serverURL = 'http://localhost:8080';
const tooManyInfoStory = {
  title: 'test story title',
  text: 'test text story',
  url: 'http://google.it',
};
let textStory = {
  title: config.defaultValues.showStartWith + ' test story title',
  text: 'test text story',
  url: '',
};
let urlStory = {
  title: config.defaultValues.askStartWith + 'test story title',
  url: 'http://google.it',
  text: '',
};
let story;
let user;
let newCommentId;
let newCommentIdChild;

const badRequestBaseCheck = (data, status, statusCode, haveInfo = true) => {
  expect(data).to.be.not.empty;
  expect(data.error).to.be.true;
  expect(data.result).to.be.an('object');
  expect(data.result.description).to.be.a('string');
  expect(data.result.status).to.be.equal(status);
  expect(data.result.statusCode).to.be.equal(statusCode);
  if (haveInfo) expect(data.result.details).to.be.an('array');
};
const baseSuccessResult = (data, isArrayResuilt = false) => {
  expect(data).to.be.not.empty;
  expect(data.error).to.be.false;
  expect(data.result).to.be.an('object');
  expect(data.result.success).to.be.true;
  if (!isArrayResuilt) expect(data.result.data).to.be.an('object');
};

describe('## API users test /api/stories', () => {

  before(async() => {
    logger.transports[0].level = 'error';
    await db.connect(config.database.connectionString);
    const instance = db.get(config.database.defaultDbName);

    user = await instance.collection(Collections.Users).insertOne({
      username: 'atestuser',
      password: '$2a$08$pJg9xU8Pd0KlL8lMaQplFut0nYvuUo6JwsEr3TkZb08mW8nK0cG1m',
      created_on: new Date(),
      karma: 1,
    });
    user = user.ops[0];

    story = await instance.collection(Collections.Stories).insertOne({
      text: 'test story to vote',
      title: 'test story to vote',
      user_id: new ObjectID(),
      created_on: new Date(),
      karma: 1,
    });
    story = story.ops[0];
  });

  after(async() => {
    const instance = db.get(config.database.defaultDbName);
    await instance.collection(Collections.Users).deleteOne({ _id: user._id });
    if (story._id) await instance.collection(Collections.Stories).deleteOne({ _id: ObjectID(story._id) });
    if (textStory._id) await instance.collection(Collections.Stories).deleteOne({ _id: ObjectID(textStory._id) });
    if (urlStory._id) await instance.collection(Collections.Stories).deleteOne({ _id: ObjectID(urlStory._id) });
    if (newCommentId) await instance.collection(Collections.Comments).deleteOne({ _id: ObjectID(newCommentId) });
    if (newCommentIdChild) await instance.collection(Collections.Comments).deleteOne({ _id: ObjectID(newCommentIdChild) });

    await db.close();
  });

  describe('# POST /api/stories/', () => {
    let authToken;
    let storiesUrl = '/api/stories/';

    before((done) => {
      request(serverURL)
        .post('/api/users/login')
        .send({ username: user.username, password: 'password.123' })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.auth).to.be.true;
          expect(res.body.result.data.token).to.be.not.null;

          authToken = res.body.result.data.token;

          done();
        }).catch(done);
    });

    it('should fail to write the story if the token is empty', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to write the story if the token is wrong', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .set({'x-access-token': 'wrongtoken'})
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to write the story if and empty object has sent', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .set({'x-access-token': authToken})
        .send({})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(3);

          done();
        }).catch(done);
    });

    it('should fail to write the story if not enough info has been sent', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .set({'x-access-token': authToken})
        .send({ title: 'just title' })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail to write the story if an unknown key has been sent', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .set({'x-access-token': authToken})
        .send({ title: 'just title', unknown: 'me' })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(3);

          done();
        }).catch(done);
    });

    it('should fail to write the story if empty text has sent', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .set({'x-access-token': authToken})
        .send({ title: 'just title', text: '' })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to write the story if empty url has sent', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .set({'x-access-token': authToken})
        .send({ title: 'just title', url: '' })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to write the story if wrong url has sent', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .set({'x-access-token': authToken})
        .send({ title: 'just title', url: 'wrong_url' })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail to write the story if both url and text has sent', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .set({'x-access-token': authToken})
        .send(tooManyInfoStory)
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, false);
          expect(res.body.result.description).to.be.equal(Errors.CREATE_STORY_TOO_MANY_INFO_ERROR);

          done();
        }).catch(done);
    });

    it('should create the story correctly', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .set({'x-access-token': authToken})
        .send(textStory)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          textStory._id = res.body.result.data.insertedId;

          done();
        }).catch(done);
    });

    it('should create the story correctly', (done) => {
      request(serverURL)
        .post(storiesUrl)
        .set({'x-access-token': authToken})
        .send(urlStory)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          urlStory._id = res.body.result.data.insertedId;

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/stories/', () => {
    const storiesUrl = '/api/stories';

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: -1, take: -4 })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: (config.defaultValues.minTake - 1) })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should get the story list', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, config.defaultValues.take);
          expect(res.body.result.data.stories_count).to.be.not.null;

          done();
        }).catch(done);
    });

    it('should get the story list with skip, take', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: 5 })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, 5);
          expect(res.body.result.data.stories_count).to.be.not.null;

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/stories/show/', () => {
    const storiesUrl = '/api/stories/show';

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: -1, take: -4 })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: (config.defaultValues.minTake - 1) })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should get the story list', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, config.defaultValues.take);
          expect(res.body.result.data.stories_count).to.be.not.null;

          for (let index = 0; index < res.body.result.data.stories.length; index++) {
            const element = res.body.result.data.stories[index];

            expect(element.title).to.be.not.null;
            expect(element.title.startsWith(config.defaultValues.showStartWith)).to.be.true;
          }

          done();
        }).catch(done);
    });

    it('should get the story list with skip, take', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: 5 })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, 5);
          expect(res.body.result.data.stories_count).to.be.not.null;

          for (let index = 0; index < res.body.result.data.stories.length; index++) {
            const element = res.body.result.data.stories[index];

            expect(element.title).to.be.not.null;
            expect(element.title.startsWith(config.defaultValues.showStartWith)).to.be.true;
          }

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/stories/ask/', () => {
    const storiesUrl = '/api/stories/ask';

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: -1, take: -4 })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: (config.defaultValues.minTake - 1) })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should get the story list', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, config.defaultValues.take);
          expect(res.body.result.data.stories_count).to.be.not.null;

          for (let index = 0; index < res.body.result.data.stories.length; index++) {
            const element = res.body.result.data.stories[index];

            expect(element.title).to.be.not.null;
            expect(element.title.startsWith(config.defaultValues.askStartWith)).to.be.true;
          }

          done();
        }).catch(done);
    });

    it('should get the story list with skip, take', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: 5 })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, 5);
          expect(res.body.result.data.stories_count).to.be.not.null;

          for (let index = 0; index < res.body.result.data.stories.length; index++) {
            const element = res.body.result.data.stories[index];

            expect(element.title).to.be.not.null;
            expect(element.title.startsWith(config.defaultValues.askStartWith)).to.be.true;
          }

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/stories/new', () => {
    const storiesUrl = '/api/stories/new';

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: -1, take: -4 })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: (config.defaultValues.minTake - 1) })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should get the story list', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, config.defaultValues.take);
          expect(res.body.result.data.stories_count).to.be.not.null;

          let previousDate = null;
          for (let index = 0; index < res.body.result.data.stories.length; index++) {
            const element = res.body.result.data.stories[index];

            expect(Date.parse(element.created_on)).to.be.not.NaN;
            if (previousDate) expect(Date.parse(element.created_on) <= previousDate).to.be.true;

            previousDate = Date.parse(element.created_on);
          }

          done();
        }).catch(done);
    });

    it('should get the story list with skip, take', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: 5 })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, 5);
          expect(res.body.result.data.stories_count).to.be.not.null;

          let previousDate = null;
          for (let index = 0; index < res.body.result.data.stories.length; index++) {
            const element = res.body.result.data.stories[index];

            expect(Date.parse(element.created_on)).to.be.not.NaN;
            if (previousDate) expect(Date.parse(element.created_on) <= previousDate).to.be.true;

            previousDate = Date.parse(element.created_on);
          }

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/stories/shownew/', () => {
    const storiesUrl = '/api/stories/shownew';

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: -1, take: -4 })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: (config.defaultValues.minTake - 1) })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should get the story list', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, config.defaultValues.take);
          expect(res.body.result.data.stories_count).to.be.not.null;

          let previousDate = null;
          for (let index = 0; index < res.body.result.data.stories.length; index++) {
            const element = res.body.result.data.stories[index];

            expect(element.title).to.be.not.null;
            expect(element.title.startsWith(config.defaultValues.showStartWith)).to.be.true;
            expect(Date.parse(element.created_on)).to.be.not.NaN;

            if (previousDate) expect(Date.parse(element.created_on) <= previousDate).to.be.true;

            previousDate = Date.parse(element.created_on);
          }

          done();
        }).catch(done);
    });

    it('should get the story list with skip, take', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: 5 })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, 5);
          expect(res.body.result.data.stories_count).to.be.not.null;

          let previousDate = null;
          for (let index = 0; index < res.body.result.data.stories.length; index++) {
            const element = res.body.result.data.stories[index];

            expect(element.title).to.be.not.null;
            expect(element.title.startsWith(config.defaultValues.showStartWith)).to.be.true;
            expect(Date.parse(element.created_on)).to.be.not.NaN;

            if (previousDate) expect(Date.parse(element.created_on) <= previousDate).to.be.true;

            previousDate = Date.parse(element.created_on);
          }

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/stories/asknew/', () => {
    const storiesUrl = '/api/stories/asknew';

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: -1, take: -4 })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: (config.defaultValues.minTake - 1) })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should get the story list', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, config.defaultValues.take);
          expect(res.body.result.data.stories_count).to.be.not.null;

          let previousDate = null;
          for (let index = 0; index < res.body.result.data.stories.length; index++) {
            const element = res.body.result.data.stories[index];

            expect(element.title).to.be.not.null;
            expect(element.title.startsWith(config.defaultValues.askStartWith)).to.be.true;
            expect(Date.parse(element.created_on)).to.be.not.NaN;

            if (previousDate) expect(Date.parse(element.created_on) <= previousDate).to.be.true;

            previousDate = Date.parse(element.created_on);
          }

          done();
        }).catch(done);
    });

    it('should get the story list with skip, take', (done) => {
      request(serverURL)
        .get(storiesUrl)
        .query({ skip: 0, take: 5 })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.stories).to.be.an('array');
          expect(res.body.result.data.stories.length).to.be.within(0, 5);
          expect(res.body.result.data.stories_count).to.be.not.null;

          let previousDate = null;
          for (let index = 0; index < res.body.result.data.stories.length; index++) {
            const element = res.body.result.data.stories[index];

            expect(element.title).to.be.not.null;
            expect(element.title.startsWith(config.defaultValues.askStartWith)).to.be.true;
            expect(Date.parse(element.created_on)).to.be.not.NaN;

            if (previousDate) expect(Date.parse(element.created_on) <= previousDate).to.be.true;

            previousDate = Date.parse(element.created_on);
          }

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/stories/[story_id]', () => {
    let currentStoryUrl;
    let wrongStoryUrl;

    before(() => {
      currentStoryUrl = '/api/stories/' + textStory._id;
      wrongStoryUrl = '/api/stories/wrong_id';
    });

    it('should fail get the story if url is wrong', (done) => {
      request(serverURL)
        .get(wrongStoryUrl)
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should get the story correctly', (done) => {
      request(serverURL)
        .get(currentStoryUrl)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data._id).to.be.not.null;
          expect(res.body.result.data.title).to.be.not.null;
          expect(res.body.result.data.text).to.be.not.null;
          expect(res.body.result.data.url).to.be.empty;
          expect(res.body.result.data.base_url).to.be.empty;
          expect(res.body.result.data.karma).to.be.equal(1);
          expect(res.body.result.data.user).to.be.an('object');
          expect(res.body.result.data.created_on).to.be.not.null;
          expect(Date.parse(res.body.result.data.created_on)).to.be.not.NaN;
          expect(res.body.result.data.comments).to.be.an('array');
          expect(res.body.result.data.comment_count).to.be.not.null;

          done();
        }).catch(done);
    });

  });

  describe('# POST /api/stories/[story_id]/comments', () => {
    let storyCommmentsUrl;
    let wrongStoryCommmentsUrl = '/api/stories/wrong_id/comments';
    let authToken;

    before((done) => {
      storyCommmentsUrl = '/api/stories/' + textStory._id + '/comments';

      request(serverURL)
        .post('/api/users/login')
        .send({ username: user.username, password: 'password.123' })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.auth).to.be.true;
          expect(res.body.result.data.token).to.be.not.null;

          authToken = res.body.result.data.token;

          done();
        }).catch(done);
    });

    it('should fail to comment if the token is empty', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to comment if the token is wrong', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .set({'x-access-token': 'wrongtoken'})
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to comment if wrong story ID is provided', (done) => {
      request(serverURL)
        .post(wrongStoryCommmentsUrl)
        .set({'x-access-token': authToken})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail to comment if the request provided is empty', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .set({'x-access-token': authToken})
        .send({})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to comment if the request provided contains unknown fields', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .set({'x-access-token': authToken})
        .send({ text: 'comment', strange_field: '' })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to comment if the request provided contains an empty comment text', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .set({'x-access-token': authToken})
        .send({ text: '' })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should comment the story correctly', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .set({'x-access-token': authToken})
        .send({ text: 'a comment' })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          newCommentId = res.body.result.data.insertedId;

          done();
        }).catch(done);
    });

  });

  describe('# POST /api/stories/[story_id]/comments/[comment_id]', () => {
    let storyCommmentsUrl;
    let wrongDoubleStoryCommmentsUrl = '/api/stories/wrong_id/comments';
    let wrongStoryCommentCommmentsUrl;
    let wrongStoryCommmentsUrl;
    let authToken;

    before((done) => {
      storyCommmentsUrl = '/api/stories/' + textStory._id + '/comments/' + newCommentId;
      wrongStoryCommentCommmentsUrl = '/api/stories/' + textStory._id + '/comments/wrong_id';
      wrongStoryCommmentsUrl = '/api/stories/wrong_id/comments/' + newCommentId;

      request(serverURL)
        .post('/api/users/login')
        .send({ username: user.username, password: 'password.123' })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.auth).to.be.true;
          expect(res.body.result.data.token).to.be.not.null;

          authToken = res.body.result.data.token;

          done();
        }).catch(done);
    });

    it('should fail to comment if the token is empty', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to comment if the token is wrong', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .set({'x-access-token': 'wrongtoken'})
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to comment if wrong ID (storyId) is provided', (done) => {
      request(serverURL)
        .post(wrongStoryCommmentsUrl)
        .set({'x-access-token': authToken})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail to comment if wrong ID (commentId) is provided', (done) => {
      request(serverURL)
        .post(wrongStoryCommentCommmentsUrl)
        .set({'x-access-token': authToken})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail to comment if both IDs are wrong', (done) => {
      request(serverURL)
        .post(wrongDoubleStoryCommmentsUrl)
        .set({'x-access-token': authToken})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail to comment if the request provided is empty', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .set({'x-access-token': authToken})
        .send({})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to comment if the request provided contains unknown fields', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .set({'x-access-token': authToken})
        .send({ text: 'comment', strange_field: '' })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to comment if the request provided contains an empty comment text', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .set({'x-access-token': authToken})
        .send({ text: '' })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should comment the story correctly', (done) => {
      request(serverURL)
        .post(storyCommmentsUrl)
        .set({'x-access-token': authToken})
        .send({ text: 'a comment child' })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          newCommentIdChild = res.body.result.data.insertedId;

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/stories/[story_id]/comments', () => {
    let currentStoryUrl;
    let wrongStoryUrl;

    before(() => {
      currentStoryUrl = '/api/stories/' + textStory._id + '/comments';
      wrongStoryUrl = '/api/stories/wrong_id/comments';
    });

    it('should fail get the story comments if url is wrong', (done) => {
      request(serverURL)
        .get(wrongStoryUrl)
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should get the story comments correctly', (done) => {
      request(serverURL)
        .get(currentStoryUrl)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body, true);
          expect(res.body.result.data).to.be.an('array');
          expect(res.body.result.data).to.be.have.lengthOf(1);
          expect(res.body.result.data[0]._id).to.be.not.null;
          expect(res.body.result.data[0].text).to.be.not.null;
          expect(res.body.result.data[0].karma).to.be.equal(1);
          expect(res.body.result.data[0].created_on).to.be.not.null;
          expect(Date.parse(res.body.result.data[0].created_on)).to.be.not.NaN;
          expect(res.body.result.data[0].user).to.be.an('object');
          expect(res.body.result.data[0].story).to.be.an('object');
          expect(res.body.result.data[0].is_deleted).to.be.false;
          expect(res.body.result.data[0].children).to.be.an('array');
          expect(res.body.result.data[0].children).to.have.lengthOf(1);

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/stories/[story_id]/comments/[comment_id]', () => {
    let currentStoryUrl;
    let bothWrongIds;
    let wrongStoryId;
    let wrongCommentStoryId;

    before(() => {
      currentStoryUrl = '/api/stories/' + textStory._id + '/comments/' + newCommentIdChild;
      bothWrongIds = '/api/stories/wrong_id/comments/wrong_comment_id';
      wrongStoryId = '/api/stories/wrong_id/comments/' + newCommentId;
      wrongCommentStoryId = '/api/stories/' + textStory._id + '/comments/wrong_comment_id';
    });

    it('should fail get the story comments if url is wrong (both wrong ids)', (done) => {
      request(serverURL)
        .get(bothWrongIds)
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail get the story comments if url is wrong (wrong story ID)', (done) => {
      request(serverURL)
        .get(wrongStoryId)
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail get the story comments if url is wrong (wrong comment ID)', (done) => {
      request(serverURL)
        .get(wrongCommentStoryId)
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should get the story comments correctly', (done) => {
      request(serverURL)
        .get(currentStoryUrl)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body, true);
          expect(res.body.result.data).to.be.an('array');
          expect(res.body.result.data).to.be.have.lengthOf(1);
          expect(res.body.result.data[0]._id).to.be.not.null;
          expect(res.body.result.data[0].text).to.be.not.null;
          expect(res.body.result.data[0].karma).to.be.equal(1);
          expect(res.body.result.data[0].created_on).to.be.not.null;
          expect(Date.parse(res.body.result.data[0].created_on)).to.be.not.NaN;
          expect(res.body.result.data[0].user).to.be.an('object');
          expect(res.body.result.data[0].story).to.be.an('object');
          expect(res.body.result.data[0].is_deleted).to.be.false;
          expect(res.body.result.data[0].children).to.be.an('array');

          done();
        }).catch(done);
    });

  });

  describe('# PUT /api/stories/[story_id]/vote', () => {
    let storyUrl;
    let story2Url;
    let wrongStoryUrl = '/api/stories/wrong_id/vote';
    let authToken;

    before((done) => {
      storyUrl = '/api/stories/' + textStory._id + '/vote';
      story2Url = '/api/stories/' + story._id + '/vote';

      request(serverURL)
        .post('/api/users/login')
        .send({ username: user.username, password: 'password.123' })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.auth).to.be.true;
          expect(res.body.result.data.token).to.be.not.null;

          authToken = res.body.result.data.token;

          done();
        }).catch(done);
    });

    it('should fail to vote if the token is empty', (done) => {
      request(serverURL)
        .put(storyUrl)
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to vote if the token is wrong', (done) => {
      request(serverURL)
        .put(storyUrl)
        .set({'x-access-token': 'wrongtoken'})
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to vote if wrong story ID is provided', (done) => {
      request(serverURL)
        .put(wrongStoryUrl)
        .set({'x-access-token': authToken})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail to vote the story if the wrong information are not provided', (done) => {
      request(serverURL)
        .put(storyUrl)
        .set({'x-access-token': authToken})
        .send({ direction: 'not_down_nor_up'})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to vote the story if empty information are provided', (done) => {
      request(serverURL)
        .put(storyUrl)
        .set({'x-access-token': authToken})
        .send({})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to vote the story if not expected field is provided', (done) => {
      request(serverURL)
        .put(storyUrl)
        .set({'x-access-token': authToken})
        .send({ direction: 'up', not_expected: true })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to vote the user\'s story', (done) => {
      request(serverURL)
        .put(storyUrl)
        .set({'x-access-token': authToken})
        .send({ direction: 'up' })
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new WarningResult(Warnings.CANT_VOTE_YOUR_STORY));

          done();
        }).catch(done);
    });

    it('should vote the story correctly', (done) => {
      request(serverURL)
        .put(story2Url)
        .set({'x-access-token': authToken})
        .send({ direction: 'up' })
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new OkResult(Infos.CREATE_VOTE_OK));

          done();
        }).catch(done);
    });

  });

  describe('# DELETE /api/stories/[story_id]/vote', () => {
    let storyUrl;
    let story2Url;
    let wrongStoryUrl = '/api/stories/wrong_id/vote';
    let authToken;

    before((done) => {
      storyUrl = '/api/stories/' + textStory._id + '/vote';
      story2Url = '/api/stories/' + story._id + '/vote';

      request(serverURL)
        .post('/api/users/login')
        .send({ username: user.username, password: 'password.123' })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.auth).to.be.true;
          expect(res.body.result.data.token).to.be.not.null;

          authToken = res.body.result.data.token;

          done();
        }).catch(done);
    });

    it('should fail to unvote if the token is empty', (done) => {
      request(serverURL)
        .delete(storyUrl)
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to unvote if the token is wrong', (done) => {
      request(serverURL)
        .delete(storyUrl)
        .set({'x-access-token': 'wrongtoken'})
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to unvote if wrong story ID is provided', (done) => {
      request(serverURL)
        .delete(wrongStoryUrl)
        .set({'x-access-token': authToken})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to unvote the story that you never voted', (done) => {
      request(serverURL)
        .delete(storyUrl)
        .set({'x-access-token': authToken})
        .expect(404)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new NotFoundError(Errors.NOT_VOTE_FOUND_ERROR));

          done();
        }).catch(done);
    });

    it('should unvote the story correctly', (done) => {
      request(serverURL)
        .delete(story2Url)
        .set({'x-access-token': authToken})
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new OkResult(Infos.CREATE_UNVOTE_OK));

          done();
        }).catch(done);
    });

  });

  describe('# DELETE /api/stories/[story_id]', () => {
    let storyUrl;
    let story2Url;
    let wrongStoryUrl = '/api/stories/wrong_id';
    let authToken;

    before((done) => {
      storyUrl = '/api/stories/' + textStory._id;
      story2Url = '/api/stories/' + story._id;

      request(serverURL)
        .post('/api/users/login')
        .send({ username: user.username, password: 'password.123' })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.auth).to.be.true;
          expect(res.body.result.data.token).to.be.not.null;

          authToken = res.body.result.data.token;

          done();
        }).catch(done);
    });

    it('should fail to delete the story if the token is empty', (done) => {
      request(serverURL)
        .delete(storyUrl)
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to delete the story if the token is wrong', (done) => {
      request(serverURL)
        .delete(storyUrl)
        .set({'x-access-token': 'wrongtoken'})
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to delete the story if wrong story ID is provided', (done) => {
      request(serverURL)
        .delete(wrongStoryUrl)
        .set({'x-access-token': authToken})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to delete the story a story that doesn\'t belongs to you', (done) => {
      request(serverURL)
        .delete(story2Url)
        .set({'x-access-token': authToken})
        .expect(403)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new ForbiddenError(Errors.FORBIDDEN_DELETE_STORY_ERROR));

          done();
        }).catch(done);
    });

    it('should delete the story correctly', (done) => {
      request(serverURL)
        .delete(storyUrl)
        .set({'x-access-token': authToken})
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new OkResult(Infos.DELETE_STORY_INFO));

          done();
        }).catch(done);
    });

  });

});
