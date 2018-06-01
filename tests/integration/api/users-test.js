import { expect } from 'chai';
import { logger } from '../../../src/helpers/logger';
import { Collections, Infos, ErrorsCode, HttpStatus, Errors } from '../../../src/constants/index';
import { ApiError, UnauthorizedError, ForbiddenError } from '../../../src/results/api-errors';
import request from 'supertest-as-promised';
import config from '../../../config';
import * as db from '../../../src/db/connector';
import { OkResult } from '../../../src/results/api-data';

const serverURL = 'http://localhost:8080';
const empty = { };
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
const validUser = {
  username: 'usertest',
  password: 'password.123',
};
const validUser2 = {
  username: 'usertest2',
  password: 'password.123',
};

describe('## API users test /api/users', () => {
  let authToken = '';
  let newUserId = '';

  before(async() => {
    logger.transports[0].level = 'error';
    await db.connect(config.database.connectionString);
  });

  after(async() => {
    const instance = db.get(config.database.defaultDbName);
    await instance.collection(Collections.Users).deleteOne({username: validUser.username});
    await instance.collection(Collections.Users).deleteOne({username: validUser2.username});
    await db.close();
  });

  describe('# POST /api/users', () => {
    const createUserUrl = '/api/users';

    it('should fail to create the user', (done) => {
      request(serverURL)
        .post(createUserUrl)
        .send(empty)
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail to create the user (username not provided)', (done) => {
      request(serverURL)
        .post(createUserUrl)
        .send({password: 'test.123'})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to create the user (password not provided)', (done) => {
      request(serverURL)
        .post(createUserUrl)
        .send({username: 'test'})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to create the user (password too short)', (done) => {
      request(serverURL)
        .post(createUserUrl)
        .send({username: 'test', password: '123'})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to create the user if not required information are passed (an additional field)', (done) => {
      request(serverURL)
        .post(createUserUrl)
        .send({username: validUser.username, password: validUser.password, about: 'its me'})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should create the user correctly', (done) => {
      request(serverURL)
        .post(createUserUrl)
        .send(validUser)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.description).to.be.equal(Infos.CREATE_USER_INFO);
          expect(res.body.result.data.insertedId).to.be.not.null;
          newUserId = res.body.result.data.insertedId;

          done();
        }).catch(done);
    });

    it('should create the user correctly (2)', (done) => {
      request(serverURL)
        .post(createUserUrl)
        .send(validUser2)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.description).to.be.equal(Infos.CREATE_USER_INFO);
          expect(res.body.result.data.insertedId).to.be.not.null;
          validUser2._id = res.body.result.data.insertedId;

          done();
        }).catch(done);
    });

    it('should fail to create again a user with the same username', (done) => {
      request(serverURL)
        .post(createUserUrl)
        .send(validUser)
        .expect(500)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new ApiError(Errors.CREATE_USER_USERNAME_ERROR));

          done();
        }).catch(done);
    });

  });

  describe('# POST /api/users/login', () => {
    const loginUrl = '/api/users/login';

    it('should fail to login with an empty request', (done) => {
      request(serverURL)
        .post(loginUrl)
        .send(empty)
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail to login with an wrong request (no password provided)', (done) => {
      request(serverURL)
        .post(loginUrl)
        .send({ username: validUser.username })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to login with an wrong request (no username provided)', (done) => {
      request(serverURL)
        .post(loginUrl)
        .send({ password: validUser.password })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to login sending wrong body params (additional not required)', (done) => {
      request(serverURL)
        .post(loginUrl)
        .send({ username: validUser.username, password: validUser.password, about: 'its me' })
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should fail to login with an wrong request (wrong user provided)', (done) => {
      request(serverURL)
        .post(loginUrl)
        .send({ username: 'wrongusername', password: validUser.password })
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.USERNAME_NOT_FOUND));

          done();
        }).catch(done);
    });

    it('should fail to login with an wrong request (wrong password provided)', (done) => {
      request(serverURL)
        .post(loginUrl)
        .send({ username: validUser.username, password: 'wrongPassword' })
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.USER_WRONG_PASSWORD));

          done();
        }).catch(done);
    });

    it('should login correctly', (done) => {
      request(serverURL)
        .post(loginUrl)
        .send(validUser)
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data.auth).to.be.true;
          expect(res.body.result.data.token).to.be.not.null;

          authToken = res.body.result.data.token;

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/users/me', () => {
    const currentUserUrl = '/api/users/me';

    it('should fail get the user if the token is empty', (done) => {
      request(serverURL)
        .get(currentUserUrl)
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

          done();
        }).catch(done);
    });

    it('should fail get the user if the token is wrong', (done) => {
      request(serverURL)
        .get(currentUserUrl)
        .set({'x-access-token': 'wrongtoken'})
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));

          done();
        }).catch(done);
    });

    it('should get the logged user correctly', (done) => {
      request(serverURL)
        .get(currentUserUrl)
        .set({'x-access-token': authToken})
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data._id).to.be.not.null;
          expect(res.body.result.data.username).to.be.equal(validUser.username);
          expect(res.body.result.data.created_on).to.be.not.null;
          expect(Date.parse(res.body.result.data.created_on)).to.be.not.NaN;
          expect(res.body.result.data.karma).to.be.equal(1);

          done();
        }).catch(done);
    });

  });

  describe('# GET /api/users/[user_id]', () => {
    let currentUserUrl;

    before(() => {
      currentUserUrl = '/api/users/' + newUserId;
    });

    it('should fail get the user if the token is empty', (done) => {
      request(serverURL)
        .get(currentUserUrl)
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

          done();
        }).catch(done);
    });

    it('should fail get the user if the token is wrong', (done) => {
      request(serverURL)
        .get(currentUserUrl)
        .set({'x-access-token': 'wrongtoken'})
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));

          done();
        }).catch(done);
    });

    it('should get the user correctly', (done) => {
      request(serverURL)
        .get(currentUserUrl)
        .set({'x-access-token': authToken})
        .expect(200)
        .then((res) => {
          baseSuccessResult(res.body);
          expect(res.body.result.data._id).to.be.not.null;
          expect(res.body.result.data.username).to.be.equal(validUser.username);
          expect(res.body.result.data.created_on).to.be.not.null;
          expect(Date.parse(res.body.result.data.created_on)).to.be.not.NaN;
          expect(res.body.result.data.karma).to.be.equal(1);

          done();
        }).catch(done);
    });

  });

  describe('# PATCH /api/users/[user_id]', () => {
    let currentUserUrl;
    let anotherUserUrl;

    before(() => {
      currentUserUrl = '/api/users/' + newUserId;
      anotherUserUrl = '/api/users/' + validUser2._id;
    });

    it('should fail to update the user if the token is empty', (done) => {
      request(serverURL)
        .patch(currentUserUrl)
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_REQUIRED_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to update the user if the token is wrong', (done) => {
      request(serverURL)
        .patch(currentUserUrl)
        .set({'x-access-token': 'wrongtoken'})
        .expect(401)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new UnauthorizedError(Errors.AUTH_TOKEN_ERROR));

          done();
        }).catch(done);
    });

    it('should fail to update the user if the information are not provided', (done) => {
      request(serverURL)
        .patch(currentUserUrl)
        .set({'x-access-token': authToken})
        .send({})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(2);

          done();
        }).catch(done);
    });

    it('should fail to update the user if the email is wrong', (done) => {
      request(serverURL)
        .patch(currentUserUrl)
        .set({'x-access-token': authToken})
        .send({email: 'not a valid email', about: ''})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

    it('should update the user correctly (only email)', (done) => {
      request(serverURL)
        .patch(currentUserUrl)
        .set({'x-access-token': authToken})
        .send({email: 'aaa@validemail.it', about: '' })
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new OkResult(Infos.UPDATE_USER_INFO));

          done();
        }).catch(done);
    });

    it('should update the user correctly (both)', (done) => {
      request(serverURL)
        .patch(currentUserUrl)
        .set({'x-access-token': authToken})
        .send({email: 'aaa@validemail.it', about: 'only here'})
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new OkResult(Infos.UPDATE_USER_INFO));

          done();
        }).catch(done);
    });

    it('should update the user correctly (reset about)', (done) => {
      request(serverURL)
        .patch(currentUserUrl)
        .set({'x-access-token': authToken})
        .send({email: 'aaa@validemail.it', about: ''})
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new OkResult(Infos.UPDATE_USER_INFO));

          done();
        }).catch(done);
    });

    it('should fail to update another user info', (done) => {
      request(serverURL)
        .patch(anotherUserUrl)
        .set({'x-access-token': authToken})
        .send({email: 'aaa@validemail.it', about: '' })
        .expect(403)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new ForbiddenError(Errors.UPDATE_OTHER_USER_ERROR));

          done();
        }).catch(done);
    });

  });

});
