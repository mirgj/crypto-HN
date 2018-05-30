import chai, { expect } from 'chai';
import { NotFoundError } from '../../../src/results/api-errors';
import request from 'supertest-as-promised';
const serverURL = 'http://localhost:8080';


describe('## API test /', () => {

  describe('# (GET|POST|PUT|DELETE) /api/notExist', () => {
    let currentUrl = '/api/notExist';

    it('should fail and return a not found error GET', (done) => {
      request(serverURL)
        .get(currentUrl)
        .expect(404)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new NotFoundError('API method not found'));
          done();
        }).catch(done);
    });

    it('should fail and return a not found error POST', (done) => {
      request(serverURL)
        .post(currentUrl)
        .expect(404)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new NotFoundError('API method not found'));
          done();
        }).catch(done);
    });

    it('should fail and return a not found error PUT', (done) => {
      request(serverURL)
        .put(currentUrl)
        .expect(404)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new NotFoundError('API method not found'));
          done();
        }).catch(done);
    });

    it('should fail and return a not found error DELETE', (done) => {
      request(serverURL)
        .delete(currentUrl)
        .expect(404)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new NotFoundError('API method not found'));
          done();
        }).catch(done);
    });

    it('should fail and return a not found error PATCH', (done) => {
      request(serverURL)
        .patch(currentUrl)
        .expect(404)
        .then((res) => {
          expect(res.body).to.be.deep.equal(new NotFoundError('API method not found'));
          done();
        }).catch(done);
    });

  });

});
