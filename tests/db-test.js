import { expect } from 'chai';
import { logger } from '../src/helpers/logger';
import { Errors } from '../src/constants/index';
import config from '../config';
import * as db from '../src/db/connector';

describe('## DB', () => {

  before(() => {
    logger.transports[0].level = 'error';
  });

  describe('# Initial tests', () => {

    it('it should have the configuration', (done) => {
      expect(config).to.be.an('object');
      expect(config.database).to.be.an('object');
      expect(config.database.connectionString).to.be.not.null;
      expect(config.database.connectionString).to.be.a('string');
      expect(config.database.connectionString).to.match(/^mongodb/);
      expect(config.database.defaultDbName).to.be.not.null;
      expect(config.database.defaultDbName).to.be.a('string');

      done();
    });

    it('it should return null for the current status', (done) => {
      expect(db.state.instance).to.be.null;
      expect(db.state.defaultDbInstance).to.be.null;

      done();
    });

    it('it should fail to connect', async() => {
      try {
        await db.connect('wrong connection string');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
      }
    });

    it('it should fail to get the database instance if not connected', (done) => {
      try {
        db.get(config.database.defaultDbName);
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal(Errors.DB_ERROR);

        done();
      }
    });

    it('it should fail to init the database if not connected', async() => {
      try {
        await db.initDefaultDb(config.database.defaultDbName);
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.be.equal(Errors.DB_ERROR);
      }
    });

    it('it should attempt to close the database connection and get false if not connected', async() => {
      const result = await db.close();
      expect(result).to.be.false;
    });

  });

  describe('# Core tests', () => {

    before(async() => {
      await db.connect(config.database.connectionString);
    });

    it('it should be connected to the database', (done) => {
      expect(db.state.instance).to.not.be.null;
      expect(db.state.defaultDbInstance).to.be.null;

      done();
    });

    it('it should close the database connection', async() => {
      const result = await db.close();
      expect(result).to.be.true;
    });

  });


});
