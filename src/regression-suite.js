const util = require('util');
const request = require('request');
const chalk = require('chalk');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);

class RegressionSuite {
  constructor(projectPath, options) {
    this.suiteFile = `${projectPath}/suite.json`;
    this.options = options;
    this.cfg = JSON.parse(fs.readFileSync(`${projectPath}/config.json`));
    this.endpoint = this.options.production ? this.cfg.endpoints.prod : this.cfg.endpoints.dev;
    this.issues = [];
    this.results = [];
    this.tests = [];
  }

  async run () {
    console.log("\n\nREGRESSION TESTS\n");
    this.tests = JSON.parse(await readFile(this.suiteFile));
    this.launchSuite();
  }

  launchSuite () {
    this.tests.examples.forEach((test, i) => {
      request
        .post({url: this.endpoint.url, body: { q: test.sentence, project: this.cfg.project }, json: true, timeout: 5000 }, (err, responseHeader, responseBody) => {
          if (err) this.handleRequestError(i, test.sentence, err);
          if (i === 0) this.model = responseBody.model;
          let result = {sentence: test.sentence};
          result.intent = this.matchIntent(test, responseBody);
          result.entities = this.matchEntities(test, responseBody);
          this.recordResult(i, result);
        })
    })
  }

  handleRequestError(index, test, err) {
    console.log(err && err.code === 'ETIMEDOUT'
      ? "Connection timed out"
      : (err && err.connect === true
        ? "Server responding too slowly"
        : "Error"));
    console.log(err);
    this.recordResult(index, {name: test.sentence, correct: false})
  }

  /**
   * Parses the response body looking for the intent expected by the test example
   * @param {string} testExample - an example from the test suite (suite.json)
   * @param {string} response - the body of the response provided by the NLU service
   * @returns {Object} - returns an 'intent match' object with the following structure:
   * {
   *   name: string
   *   correct: boolean
   *   confidence: number
   *   message: string,
   *   best_scoring: optional {
   *     name: string
   *     confidence: number
   *   }
   * }
   */
  matchIntent(testExample, response) {
    let match;
    if(response.intent.name == testExample.expected.intent.name) {
      match = {
        name: testExample.expected.intent.name,
        correct: true,
        confidence: response.intent.confidence,
        message: 'Ok'
      }
    } else {
      const overlooked = response.intent_ranking.find(function (int) {
        return int.name == testExample.expected.intent.name
      })
      if(!overlooked) {
        // console.log('RESPONSE: ', response)
        throw(`Intent '${testExample.expected.intent.name}' was not found. Please check your spelling.`);
      }
      match = {
        name: overlooked.name,
        correct: false,
        best_scoring: {
          name: response.intent.name,
          confidence: response.intent.confidence
        },
        confidence: overlooked.confidence,
        message: `'${response.intent.name}' found instead of '${overlooked.name}'`
      }
    }
    match.severity = this.intentSeverity(match)
    return match;
  }

  // List of matches for expected entities
  matchEntities(request, response) {
    if (request.expected.entities) {
      return request.expected.entities.map(ent => this.matchEntity(ent, response.entities));
    }
  }

  /**
   * Parses an array of entities looking for the expected one
   * @param {Object} expected - an expected entity, as defined in suite.json
   * @param {Array} actualList - Actual entities returned by the NLU service
   * @returns {Object} - returns an 'entity match' object with the following structure:
   * {
   *   entity: string
   *   found: boolean
   *   message: string
   *   value: optional string
   *   correct: optional boolean
   *   confidence: optional number
   *   expected: optional {
   *     entity: string
   *     value: optional string
   *     confidence: optional number
   *   }
   * }
   */
  matchEntity(expected, actualList) {
    let match = actualList.find(function (actual) {
      return (actual.entity == expected.entity);
    })
    if (match) {
      match.found = true;
      match.correct = match.value == expected.value;
      match.message = match.correct ? 'Ok' : `'${match.value}' found instead of '${expected.value}'`
    } else match = { entity: expected.entity, found: false, message: 'Not found' }
    if (!match.found || !match.correct) match.expected = expected;
    match.severity = this.entitySeverity(match)
    return match;
  }

  /**
   * Reports concisely an NLU result
   * @param {Number} index - index of the test case (unused)
   * @param {Object} result - Result returned by the NLU service
   * @returns {Object} - returns an 'entity match' object with the following structure:
   * {
   *   entity: string
   *   found: boolean
   *   message: string
   *   value: optional string
   *   correct: optional boolean
   *   confidence: optional number
   *   expected: optional {
   *     entity: string
   *     value: optional string
   *     confidence: optional number
   *   }
   * }
   */
  recordResult(index, result) {
    let severity = 0;
    
    // Log intent recognition result
    this.logIntent(result);
    severity = Math.max(severity, result.intent.severity);

    // Log entity recognition result
    result.entities.forEach(entityResult => {
      this.logEntity(entityResult);
      severity = Math.max(severity, entityResult.severity);
    });

    if (severity > 0) this.issues.push(result);
    this.results.push(result);

    // After logging the last run, start reporting issue details
    if (this.results.length == this.tests.examples.length) {
      console.log(chalk.cyan(`\n\n${this.results.length} tests run on ${this.model} in ${this.endpoint.name}`));
      this.logIssues();
    }
  }

  intentSeverity (intentResult) {
    if (!intentResult.correct) return 3;
    if (intentResult.confidence >=  0 && intentResult.confidence < this.cfg.mediumConfidence) return 2;
    if (intentResult.confidence < this.cfg.highConfidence) return 1;
    if (intentResult.confidence >= this.cfg.highConfidence) return 0;
    else throw 'Unable to evaluate match severity';
  }

  entitySeverity (entityResult) {
    if (!entityResult.found || !entityResult.correct) return 3;
    if (entityResult.confidence >=  0 && entityResult.confidence < this.cfg.mediumConfidence) return 2;
    if (entityResult.confidence < this.cfg.highConfidence) return 1;
    if (entityResult.confidence >= this.cfg.highConfidence) return 0;
    else throw 'Unable to evaluate match severity';
  }

  severityColorLog (string, severity) {
    switch (severity) {
      case 0:
        process.stdout.write(chalk.green(string)); break;
      case 1:
        process.stdout.write(chalk.yellow(string)); break;
      case 2:
        process.stdout.write(chalk.red(string)); break;
      case 3:
        process.stdout.write(chalk.magenta(string)); break;
      default:
        process.stdout.write(chalk.bgCyan(string));
    }
  }

  // synthetic log of intent recognition in a result.
  logIntent (result) {
    const sign = '#';
    this.severityColorLog(sign, result.intent.severity);
  }

  // synthetic log of entity recognition in a result.
  logEntity (entityResult) {
    const sign = '*';
    this.severityColorLog(sign, entityResult.severity);
  }

  logIssues () {
    if (this.issues.length == 0) {
      console.log(chalk.cyan('Clean run!'));
      return;
    }

    console.log(chalk.magenta(`${this.issues.length} have issues`));
    this.issues.forEach(issue => {
      console.log('\n' + issue.sentence);
      this.severityColorLog(`  ${issue.intent.name}   ${String(issue.intent.confidence).substr(0,4)}`, issue.intent.severity);
      if (issue.intent.severity === 3) {
        process.stdout.write(chalk.gray(`  <  ${issue.intent.best_scoring.name}   ${String(issue.intent.best_scoring.confidence).substr(0,4)}`));
      }
      console.log();
      issue.entities.forEach(entity => {
        const expected = entity.expected ? chalk.gray(`   instead of ${entity.expected.value}\n`) : '\n'
        this.severityColorLog(`    ${entity.entity}: ${entity.value}   ${String(entity.confidence).substr(0,4)}` + expected, entity.severity);
      })
      // console.log(issue.entities);
    });
    console.log('');
  }
}

module.exports = RegressionSuite;