import { ObjectID } from 'mongodb';
import { expect } from 'chai';
import { logger } from '../../../src/helpers/logger';
import { Collections, Errors, ErrorsCode, HttpStatus } from '../../../src/constants';
import { UnauthorizedError } from '../../../src/results/api-errors';
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
let user;

const badRequestBaseCheck = (data, status, statusCode, haveInfo = true) => {
  expect(data).to.be.not.empty;
  expect(data.error).to.be.true;
  expect(data.result).to.be.an('object');
  expect(data.result.description).to.be.a('string');
  expect(data.result.status).to.be.equal(status);
  expect(data.result.statusCode).to.be.equal(statusCode);
  if (haveInfo) expect(data.result.details).to.be.an('array');
};
const baseSuccessResult = (data) => {
  expect(data).to.be.not.empty;
  expect(data.error).to.be.false;
  expect(data.result).to.be.an('object');
  expect(data.result.success).to.be.true;
  expect(data.result.data).to.be.an('object');
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
  });

  after(async() => {
    const instance = db.get(config.database.defaultDbName);
    await instance.collection(Collections.Users).deleteOne({ _id: user._id });
    if (textStory._id) await instance.collection(Collections.Stories).deleteOne({ _id: ObjectID(textStory._id) });
    if (urlStory._id) await instance.collection(Collections.Stories).deleteOne({ _id: ObjectID(urlStory._id) });

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

});
