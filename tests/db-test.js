import { expect } from 'chai';
import * as db from '../src/db/connector';

describe('## DB', () => {

  it('it should return null for the active status', (done) => {
    expect(db.state.instance).to.be.null;
    expect(db.state.defaultDbInstance).to.be.null;

    done();
  });

});
