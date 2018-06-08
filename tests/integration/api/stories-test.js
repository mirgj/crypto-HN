import { expect } from 'chai';
import { logger } from '../../../src/helpers/logger';
import { Collections, Errors, ErrorsCode, HttpStatus } from '../../../src/constants';
import { UnauthorizedError } from '../../../src/results/api-errors';
import request from 'supertest-as-promised';
import config from '../../../config';
import * as db from '../../../src/db/connector';

const serverURL = 'http://localhost:8080';
let user;

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


  });

});
