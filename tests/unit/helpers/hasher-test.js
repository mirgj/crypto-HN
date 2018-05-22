import { expect } from 'chai';
import { __Rewire__ } from '../../../src/helpers/hasher';
import sinon from 'sinon';
import * as hasher from '../../../src/helpers/hasher';

const bcryptMock = {
  compare: () => { },
  hash: () => { },
};
const configMock = {
  keys: { hashSalt: 'val' },
};

describe('## helpers/hasher.js unit tests', () => {
  before(() => {
    __Rewire__('bcrypt', bcryptMock);
    __Rewire__('config', configMock);
  });


  describe('# compareHash', () => {
    let compareSpy;

    beforeEach(() => {
      compareSpy = sinon.stub(bcryptMock, 'compare');
    });

    afterEach(() => {
      compareSpy.restore();
    });

    it('should compare the hash correctly and return success', async() => {
      compareSpy.callsArgWith(2, null, true);
      const pwd = 'amock';
      const val = await hasher.compareHash(pwd, pwd);

      expect(val).to.be.true;
      sinon.assert.calledOnce(compareSpy);
      sinon.assert.calledWith(compareSpy, pwd, pwd);
    });

    it('should compare the hash correctly and return false success', async() => {
      compareSpy.callsArgWith(2, null, false);
      const pwd = 'amock';
      const pwd2 = 'amock2';
      const val = await hasher.compareHash(pwd, pwd2);

      expect(val).to.be.false;
      sinon.assert.calledOnce(compareSpy);
      sinon.assert.calledWith(compareSpy, pwd, pwd2);
    });

    it('should compare the hash and generate and error', async() => {
      const errMock = 'error';
      const pwd = 'amock';
      compareSpy.callsArgWith(2, errMock, false);
      try {
        await hasher.compareHash(pwd, pwd);
      } catch (err) {
        expect(err).to.be.equal(errMock);
      } finally {
        sinon.assert.calledOnce(compareSpy);
        sinon.assert.calledWith(compareSpy, pwd, pwd);
      }
    });

  });

  describe('# generateHash', () => {
    let hashSpy;

    beforeEach(() => {
      hashSpy = sinon.stub(bcryptMock, 'hash');
    });

    afterEach(() => {
      hashSpy.restore();
    });

    it('should generate the hash correctly and return the generated hash', async() => {
      const generatedhash = 'generatedhashmock';
      hashSpy.callsArgWith(2, null, generatedhash);
      const pwd = 'amock';
      const val = await hasher.generateHash(pwd);

      expect(val).to.be.equal(generatedhash);
      sinon.assert.calledOnce(hashSpy);
      sinon.assert.calledWith(hashSpy, pwd, configMock.keys.hashSalt);
    });

    it('should throw an error correctly', async() => {
      const generatedhash = 'generatedhashmock';
      const errMock = 'errmock';
      hashSpy.callsArgWith(2, errMock, generatedhash);
      const pwd = 'amock';
      try {
        await hasher.generateHash(pwd);
      } catch (err) {
        expect(err).to.be.equal(errMock);
      } finally {
        sinon.assert.calledOnce(hashSpy);
        sinon.assert.calledWith(hashSpy, pwd, configMock.keys.hashSalt);
      }
    });

  });

});
