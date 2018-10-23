#!/usr/bin/env node
const program = require('commander');
const version = require('../package.json').version;
// process.env.npm_package_version

program
  .option('-d, --development', 'test against development endpoint (default)')
  .option('-p, --production', 'test against production endpoint')
  .version(version, '-v, --version')
  .parse(process.argv);

// TODO: tokens

const projectPath =  process.argv[2];
const RegressionSuite = require('./regression-suite');
const options = {
  production: program.production,
  development: !program.production
}

let suite = new RegressionSuite(projectPath, options);
suite.run().catch(e => {console.log("RegressionSuite RUN error:", e)})



