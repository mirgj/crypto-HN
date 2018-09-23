import chai, { expect } from 'chai';
import { logger } from '../../../src/helpers/logger';
import { Collections, Errors } from '../../../src/constants/index';
import chaiAsPromised from 'chai-as-promised';
import config from '../../../config';
import * as db from '../../../src/db/connector';
chai.use(chaiAsPromised);

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
        throw new Error('should fail');
      } catch (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.not.be.null;
        expect(err.message).to.be.a('string');
        expect(err.message).to.not.be.equal('should fail');
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
      const promise = db.initDefaultDb(config.database.defaultDbName);
      expect(promise).to.be.rejected;
      expect(promise).to.be.rejectedWith(Errors.DB_ERROR);
    });

    it('it should attempt to close the database connection and get false if not connected', async() => {
      try {
        const result = await db.close();
        expect(result).to.be.false;
      } catch (err) {
        throw err;
      }
    });

  });

  describe('# Core tests', () => {

    before(async() => {
      try {
        await db.connect(config.database.connectionString);
      } catch (err) {
        await db.close();

        throw err;
      }
    });

    it('it should be connected to the database', (done) => {
      expect(db.state.instance).to.not.be.null;
      expect(db.state.defaultDbInstance).to.be.null;

      done();
    });

    it('it should be connected to the database with a valid instance', async() => {
      const instance = await db.connect();

      expect(instance).to.not.be.null;
    });

    it('it should get the default database', (done) => {
      const result = db.get(config.database.defaultDbName);

      expect(result).to.not.be.null;
      expect(result).to.be.an('object');
      expect(db.state.defaultDbInstance).to.not.be.null;
      expect(db.state.defaultDbInstance).to.be.an('object');

      done();
    });

    it('it should init the default database', async() => {
      try {
        await db.initDefaultDb(config.database.defaultDbName);
        const names = await db.state.defaultDbInstance.collections();

        expect(names).to.be.an('array');
        expect(names).to.have.lengthOf(Object.keys(Collections).length);
        names.forEach((element) => {
          expect([Collections.Stories, Collections.Users, Collections.Comments, Collections.VoteLog]).to.include(element.s.name);
        });

      } catch (err) {
        throw err;
      }
    });

    it('it should check the indexes for ' + Collections.Stories, async() => {
      try {
        const collection = db.state.defaultDbInstance.collection(Collections.Stories);
        const indexes = await collection.indexInformation();

        expect(indexes).to.include.all.keys('_id_', 'user_id_1');
        expect(indexes._id_).to.be.an('array').that.have.lengthOf(1);
        expect(indexes._id_[0]).to.be.an('array').that.have.lengthOf(2).that.include.members(['_id', 1]);
        expect(indexes.user_id_1).to.be.an('array').that.have.lengthOf(1);
        expect(indexes.user_id_1[0]).to.be.an('array').that.have.lengthOf(2).that.include.members(['user_id', 1]);
      } catch (err) {
        throw err;
      }
    });

    it('it should check the indexes for ' + Collections.Comments, async() => {
      try {
        const collection = db.state.defaultDbInstance.collection(Collections.Comments);
        const indexes = await collection.indexInformation();

        expect(indexes).to.include.all.keys('_id_', 'user_id_1');
        expect(indexes._id_).to.be.an('array').that.have.lengthOf(1);
        expect(indexes._id_[0]).to.be.an('array').that.have.lengthOf(2).that.include.members(['_id', 1]);
        expect(indexes.user_id_1).to.be.an('array').that.have.lengthOf(1);
        expect(indexes.user_id_1[0]).to.be.an('array').that.have.lengthOf(2).that.include.members(['user_id', 1]);
      } catch (err) {
        throw err;
      }
    });

    it('it should check the indexes for ' + Collections.Users, async() => {
      try {
        const collection = db.state.defaultDbInstance.collection(Collections.Users);
        const indexes = await collection.indexInformation();

        expect(indexes).to.include.all.keys('_id_', 'username_1');
        expect(indexes._id_).to.be.an('array').that.have.lengthOf(1);
        expect(indexes._id_[0]).to.be.an('array').that.have.lengthOf(2).that.include.members(['_id', 1]);
        expect(indexes.username_1).to.be.an('array').that.have.lengthOf(1);
        expect(indexes.username_1[0]).to.be.an('array').that.have.lengthOf(2).that.include.members(['username', 1]);
      } catch (err) {
        throw err;
      }
    });


    it('it should close the database connection', async() => {
      try {
        const result = await db.close();

        expect(result).to.be.true;
        expect(db.state.instance).to.be.null;
        expect(db.state.defaultDbInstance).to.be.null;
      } catch (err) {
        throw err;
      }
    });

  });


});
