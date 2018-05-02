import { ObjectID } from 'mongodb';
import { expect } from 'chai';
import * as common from '../../../src/helpers/common';

describe('## helpers/common.js unit tests', () => {

  describe('# toBaseURL', () => {

    it('it should get the base url for a http link', (done) => {
      const base = common.toBaseURL('http://google.it');

      expect(base).to.be.a('string');
      expect(base).to.be.equal('google.it', 'wrong value calculated');
      done();
    });

    it('it should get the base url for a https link', (done) => {
      const base = common.toBaseURL('http://google.it');

      expect(base).to.be.a('string');
      expect(base).to.be.equal('google.it', 'wrong value calculated');
      done();
    });

    it('it should get the base url for a http link with path', (done) => {
      const base = common.toBaseURL('http://google.it/my/awesome/path');

      expect(base).to.be.a('string');
      expect(base).to.be.equal('google.it', 'wrong value calculated');
      done();
    });

    it('it should get the base url for a https link with path', (done) => {
      const base = common.toBaseURL('https://google.it/my/awesome/path');

      expect(base).to.be.a('string');
      expect(base).to.be.equal('google.it', 'wrong value calculated');
      done();
    });

    it('it should get the base url for a link without schema', (done) => {
      const base = common.toBaseURL('google.it/my/awesome/path');

      expect(base).to.be.a('string');
      expect(base).to.be.equal('google.it', 'wrong value calculated');
      done();
    });

    it('it should get the base url for a link without schema nor path', (done) => {
      const base = common.toBaseURL('google.it');

      expect(base).to.be.a('string');
      expect(base).to.be.equal('google.it', 'wrong value calculated');
      done();
    });

  });

  describe('# treefy', () => {

    it('it should return null if called with a wrong value (null)', (done) => {
      const result = common.treefy(null);

      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([]);

      done();
    });

    it('it should return null if called with a wrong value (empty array)', (done) => {
      const result = common.treefy([]);

      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([]);

      done();
    });

    it('it should return the same array if only root provided', (done) => {
      const result = common.treefy([
        {_id: 1},
        {_id: 2},
        {_id: 3},
        {_id: 4},
      ]);

      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([
        {_id: 1, children: []},
        {_id: 2, children: []},
        {_id: 3, children: []},
        {_id: 4, children: []},
      ]);

      done();
    });

    it('it should return vediamo', (done) => {
      const result = common.treefy([
        {qq: 1},
        {qq: 2},
        {qq: 3},
        {qq: 4},
      ], true);

      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([]);

      done();
    });

    it('it should return a proper tree if elements with a parent has been provided', (done) => {
      const result = common.treefy([
        {_id: 1},
        {_id: 1.1, parent: 1},
        {_id: 1.2, parent: 1},
        {_id: 2},
        {_id: 3},
        {_id: 4},
        {_id: 4.1, parent: 4},
      ]);

      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([
        {_id: 1, children: [{_id: 1.1, children: [], parent: 1}, {_id: 1.2, children: [], parent: 1}]},
        {_id: 2, children: []},
        {_id: 3, children: []},
        {_id: 4, children: [{_id: 4.1, children: [], parent: 4}]},
      ]);

      done();
    });

  });

  describe('# subtree', () => {

    it('it should return null if called with a wrong value (null)', (done) => {
      const result = common.subtree(null);

      expect(result).to.be.null;

      done();
    });

    it('it should return null if called with a wrong value (empty array)', (done) => {
      const result = common.subtree([]);

      expect(result).to.be.null;

      done();
    });

    it('it should return the same array if a not existing ID has provided', (done) => {
      const result = common.subtree([
        {_id: 1, children: []},
        {_id: 2, children: []},
        {_id: 3, children: []},
        {_id: 4, children: []},
      ], 8);

      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([
        {_id: 1, children: []},
        {_id: 2, children: []},
        {_id: 3, children: []},
        {_id: 4, children: []},
      ]);

      done();
    });

    it('it should return the subtree array correctly', (done) => {
      const result = common.subtree([
        {_id: 1, children: []},
        {_id: 2, children: [{_id: 2.1, children: []}, {_id: 2.2, children: []}]},
        {_id: 3, children: []},
        {_id: 4, children: []},
      ], 2);

      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([
        {_id: 2, children: [{_id: 2.1, children: []}, {_id: 2.2, children: []}]},
      ]);

      done();
    });

    it('it should return the inner subtree array correctly', (done) => {
      const result = common.subtree([
        {_id: 1, children: []},
        {_id: 2, children: [{_id: 2.1, children: [{_id: 2.11, children: []}]}]},
        {_id: 3, children: []},
        {_id: 4, children: []},
      ], 2.1);

      expect(result).to.be.an('array');
      expect(result).to.be.deep.equal([
        {_id: 2.1, children: [{_id: 2.11, children: []}]},
      ]);

      done();
    });

  });

  describe('# calculateMinAndMaxIds', () => {

    it('it should return null for min and max in case of wrong data (null)', (done) => {
      const result = common.calculateMinAndMaxIds(null);

      expect(result).to.be.an('object');
      expect(result.min).to.be.null;
      expect(result.max).to.be.null;

      done();
    });

    it('it should return null for min and max in case of wrong data (empty array)', (done) => {
      const result = common.calculateMinAndMaxIds([]);

      expect(result).to.be.an('object');
      expect(result.min).to.be.null;
      expect(result.max).to.be.null;

      done();
    });

    it('it should return the actual min and max', (done) => {
      const min = ObjectID('5abb5236130fb41c1ccd1f2d');
      const max = ObjectID('5ae970d753542db45c975b8e');
      const result = common.calculateMinAndMaxIds([
        {_id: ObjectID('5abb5307a1edce1a30eba853')},
        {_id: min},
        {_id: ObjectID('5ae9709253542db45c975b8b')},
        {_id: max},
        {_id: ObjectID('5ad4255ad2b08314682eadb1')},
      ]);

      expect(result).to.be.an('object');
      expect(result.min).to.be.equal(min);
      expect(result.max).to.be.equal(max);

      done();
    });

    it('it should return the same min and max', (done) => {
      const min = ObjectID('5abb5236130fb41c1ccd1f2d');
      const result = common.calculateMinAndMaxIds([
        {_id: min},
      ]);

      expect(result).to.be.an('object');
      expect(result.min).to.be.equal(min);
      expect(result.max).to.be.equal(min);

      done();
    });

  });

});
