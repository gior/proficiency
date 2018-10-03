const expect = require('chai').expect;
console.log('suite dir:', __dirname);
const RegressionSuite = require('../src/regression-suite');

describe('RegressionSuite', () => {
  it('initializes itself with project data', () => {
    const suite = new RegressionSuite( __dirname + '/../src/sample-project')
    expect(suite.cfg.project).to.eql('new_bot');
  })
})