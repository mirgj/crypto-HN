import { expect } from 'chai';
import { logger } from '../../../src/helpers/logger';
import { ForbiddenError } from '../../../src/results/api-errors';
import sinon from 'sinon';
import * as middlewares from '../../../src/helpers/middlewares';


describe('## helpers/middlewares.js unit tests', () => {

  before(() => {
    logger.transports[0].level = 'emerg';
  });

  describe('# asyncMiddleware', () => {

    it('should resolve the promise correctly', async() => {
      const spy = sinon.stub().returns(Promise.resolve(true));
      const req = {req: 1};
      const res = {res: 1};
      const next = {next: 1};

      await middlewares.asyncMiddleware(spy)(req, res, next);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWithExactly(spy, req, res, next);
    });

    it('should reject the promise and call next with err', async() => {
      const err = 'err';
      const spy = sinon.stub().returns(Promise.reject(err));
      const req = {req: 1};
      const res = {res: 1};
      const next = sinon.spy();

      await middlewares.asyncMiddleware(spy)(req, res, next);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWithExactly(spy, req, res, next);
      sinon.assert.calledOnce(next);
      sinon.assert.calledWithExactly(next, err);
      expect(spy.calledBefore(next)).to.be.true;
    });

  });

  describe('# sameUserMiddleware', () => {

    it('should call the next route in case the user ID is the same', () => {
      const error = 'error';
      const spy = sinon.spy();
      var mockreq = {
        user: {
          _id: 'mockuserid',
        },
        params: {
          userId: 'mockuserid',
        },
      };
      middlewares.sameUserMiddleware(error)(mockreq, {}, spy);
      const args = spy.getCall(0).args;

      sinon.assert.calledOnce(spy);
      expect(args.length).to.be.equals(0);
    });

    it('should throw ForbiddenError in case the user ID is different', () => {
      const error = 'error';
      const spy = sinon.spy();
      var mockreq = {
        user: {
          _id: 'mockuserid',
        },
        params: {
          userId: 'differentuserid',
        },
      };
      try {
        middlewares.sameUserMiddleware(error)(mockreq, {}, spy);
      } catch (err) {
        expect(err).to.be.an('object');
        expect(err).to.be.deep.equal(new ForbiddenError(error));
      } finally {
        sinon.assert.notCalled(spy);
      }
    });

  });

  describe('# isAuthenticatedMiddleware', () => {

    it('should call the next route in case the user is authenticated', () => {
      const redirectUrl = '/';
      const spy = sinon.spy();
      var mockreq = {
        isAuthenticated: () => { return true; },
      };
      middlewares.isAuthenticatedMiddleware(redirectUrl)(mockreq, {}, spy);
      const args = spy.getCall(0).args;

      sinon.assert.calledOnce(spy);
      expect(args.length).to.be.equals(0);
    });

    it('should call the redirect in case the user is NOT authenticated', () => {
      const redirectUrl = '/';
      const spy = sinon.spy();
      var mockreq = {
        isAuthenticated: () => { return false; },
      };
      var mockres = {
        redirect: () => { },
      };
      const redirectSpy = sinon.spy(mockres, 'redirect');

      middlewares.isAuthenticatedMiddleware(redirectUrl)(mockreq, mockres, spy);

      sinon.assert.notCalled(spy);
      sinon.assert.calledOnce(redirectSpy);
      sinon.assert.calledWithExactly(redirectSpy, redirectUrl);
    });

  });

  describe('# notAuthenticatedMiddleware', () => {

    it('should call the next route in case the user is NOT authenticated', () => {
      const redirectUrl = '/';
      const spy = sinon.spy();
      var mockreq = {
        isAuthenticated: () => { return false; },
      };
      middlewares.notAuthenticatedMiddleware(redirectUrl)(mockreq, {}, spy);
      const args = spy.getCall(0).args;

      sinon.assert.calledOnce(spy);
      expect(args.length).to.be.equals(0);
    });

    it('should call the redirect in case the user is authenticated', () => {
      const redirectUrl = '/';
      const spy = sinon.spy();
      var mockreq = {
        isAuthenticated: () => { return true; },
      };
      var mockres = {
        redirect: () => { },
      };
      const redirectSpy = sinon.spy(mockres, 'redirect');

      middlewares.notAuthenticatedMiddleware(redirectUrl)(mockreq, mockres, spy);

      sinon.assert.notCalled(spy);
      sinon.assert.calledOnce(redirectSpy);
      sinon.assert.calledWithExactly(redirectSpy, redirectUrl);
    });

  });

});
