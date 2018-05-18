import { expect } from 'chai';
import { Warnings } from '../../../src/constants/index';
import { ApiResult, WarningResult } from '../../../src/results/api-data';
import { logger } from '../../../src/helpers/logger';
import { __Rewire__ } from '../../../src/controllers/comments-controller';
import sinon from 'sinon';
import * as commentsController from '../../../src/controllers/comments-controller';

const managerMock = {
  getAllChrono: () => { },
};

describe('## controllers/comments-controller.js unit tests', () => {

  before(() => {
    logger.transports[0].level = 'error';

    __Rewire__('manager', managerMock);
  });

  describe('# getAllChrono', () => {
    let getAllChronoSpy;

    beforeEach(() => {
      getAllChronoSpy = sinon.stub(managerMock, 'getAllChrono');
    });

    afterEach(() => {
      getAllChronoSpy.restore();
    });

    it('it should return an APIResult correctly', async() => {
      const returnValue = [{ }];
      getAllChronoSpy.returns(Promise.resolve(returnValue));

      const result = await commentsController.getAllComments(0, 10);

      sinon.assert.calledOnce(getAllChronoSpy);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new ApiResult(returnValue));
    });

    it('it should return a WarningResult in case of empty query', async() => {
      const returnValue = null;
      getAllChronoSpy.returns(Promise.resolve(returnValue));

      const result = await commentsController.getAllComments(0, 10);

      sinon.assert.calledOnce(getAllChronoSpy);
      expect(result).to.be.an('object');
      expect(result).to.be.deep.equal(new WarningResult(Warnings.NO_COMMENTS_WARNING_ALL));
    });

  });

});
