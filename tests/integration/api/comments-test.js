import { expect } from 'chai';
import { logger } from '../../../src/helpers/logger';
import { Collections, ErrorsCode, HttpStatus, Errors } from '../../../src/constants/index';
import { UnauthorizedError } from '../../../src/results/api-errors';
import request from 'supertest-as-promised';
import config from '../../../config';
import * as db from '../../../src/db/connector';

const serverURL = 'http://localhost:8080';
let user;
let story;
let comment;

const badRequestBaseCheck = (data, status, statusCode) => {
  expect(data).to.be.not.empty;
  expect(data.error).to.be.true;
  expect(data.result).to.be.an('object');
  expect(data.result.description).to.be.a('string');
  expect(data.result.status).to.be.equal(status);
  expect(data.result.statusCode).to.be.equal(statusCode);
  expect(data.result.details).to.be.an('array');
};
const baseSuccessResult = (data) => {
  expect(data).to.be.not.empty;
  expect(data.error).to.be.false;
  expect(data.result).to.be.an('object');
  expect(data.result.success).to.be.true;
  expect(data.result.data).to.be.an('object');
};

describe('## API users test /api/users', () => {
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
      text: 'test story',
      title: 'test story',
      user_id: user._id,
      created_on: new Date(),
      karma: 1,
    });
    story = story.ops[0];

    comment = await instance.collection(Collections.Comments).insertOne({
      text: 'test commnet',
      story_id: story._id,
      user_id: user._id,
      created_on: new Date(),
      karma: 1,
    });
    comment = comment.ops[0];
  });

  after(async() => {
    const instance = db.get(config.database.defaultDbName);
    await instance.collection(Collections.Users).deleteOne({ _id: user._id });
    await instance.collection(Collections.Stories).deleteOne({ _id: story._id });
    await instance.collection(Collections.Comments).deleteOne({ _id: comment._id });

    await db.close();
  });

  describe('# GET /api/comments', () => {
    const commentsUrl = '/api/comments';

    it('should return a bad request in case of wrong parameters', (done) => {
      request(serverURL)
        .get(commentsUrl)
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
        .get(commentsUrl)
        .query({ skip: 0, take: (config.defaultValues.minTake - 1) })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should get the comment list', (done) => {
      request(serverURL)
        .get(commentsUrl)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.comments).to.be.an('array');
          expect(res.body.result.data.comments.length).to.be.within(0, config.defaultValues.take);
          expect(res.body.result.data.comments_count).to.be.not.null;

          done();
        }).catch(done);
    });

    it('should get the comment list with skip, take', (done) => {
      request(serverURL)
        .get(commentsUrl)
        .query({ skip: 0, take: 5 })
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.comments).to.be.an('array');
          expect(res.body.result.data.comments.length).to.be.within(0, 5);
          expect(res.body.result.data.comments_count).to.be.not.null;

          done();
        }).catch(done);
    });

  });

  describe('# PUT /api/comments/[comment_id]/vote', () => {
    let commentUrl;
    let wrongCommentUrl = '/api/comments/wrong_id/vote';
    let authToken;

    before((done) => {
      commentUrl = '/api/comments/' + comment._id + '/vote';

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

    it('should fail get the user if the token is empty', (done) => {
      request(serverURL)
        .put(commentUrl)
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

          done();
        }).catch(done);
    });

    it('should fail get the user if the token is wrong', (done) => {
      request(serverURL)
        .put(commentUrl)
        .set({'x-access-token': 'wrongtoken'})
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));

          done();
        }).catch(done);
    });

    it('should fail get the user if wrong comment ID is provided', (done) => {
      request(serverURL)
        .put(wrongCommentUrl)
        .set({'x-access-token': authToken})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to vote the comment if the wrong information are not provided', (done) => {
      request(serverURL)
        .put(commentUrl)
        .set({'x-access-token': authToken})
        .send({ direction: 'not_down_nor_up'})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

  });

});
