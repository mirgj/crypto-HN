import { expect } from 'chai';
import { ErrorsCode, HttpStatus } from '../../../src/constants/index';
import request from 'supertest-as-promised';
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

describe('## API users test /api/users', () => {

  describe('# POST /api/users', () => {

    it('should fail to create the user', (done) => {
      request(serverURL)
        .post('/api/users')
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
        .post('/api/users')
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
        .post('/api/users')
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
        .post('/api/users')
        .send({username: 'test', password: '123'})
        .expect(400)
        .then((res) => {
          badRequestBaseCheck(res.body, ErrorsCode.BAD_REQUEST, HttpStatus.BAD_REQUEST);
          expect(res.body.result.details).to.have.length(1);

          done();
        }).catch(done);
    });

  });

});
