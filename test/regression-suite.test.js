const expect = require('chai').expect;
console.log('suite dir:', __dirname);
const RegressionSuite = require('../src/regression-suite');
const response = {
  intent: { name: 'restaurant_search', confidence: 0.9914592892349654 },
  entities: [
    {
      start: 7,
      end: 14,
      value: 'mexican',
      entity: 'cuisine',
      confidence: 0.6897580326184822,
      extractor: 'ner_crf'
    },
    { start: 26,
      end: 32,
      value: 'downtown',
      entity: 'location',
      confidence: 0.9820498243484059,
      extractor: 'ner_crf'
    }
  ],
  intent_ranking: [
    { name: 'restaurant_search', confidence: 0.9914592892349654 },
    { name: 'greetings', confidence: 0.003973657901642449 }
  ],
  text: 'Find a mexican restaurant downtown',
  project: 'new_bot',
  model: 'model_20181003-164431'
}

const example = {
  "sentence": "Find a mexican restaurant downtown",
  "expected": {
    "intent": {
      "name": "restaurant_search"
    },
    "entities": [
      {
        start: 7,
        end: 14,
        value: 'mexican',
        entity: 'cuisine'
      },
      { start: 26,
        end: 32,
        value: 'downtown',
        entity: 'location'
      }
    ]
  }
}

const suite = new RegressionSuite( __dirname + '/../src/sample-project');


describe('RegressionSuite', () => {
  it('initializes itself with project data', () => {
    expect(suite.cfg.project).to.eql('new_bot');
  })

  describe('matchIntent()', () => {
    it('records a successful match', () => {
      let match = suite.matchIntent(example, response)
      expect(match.name).to.eql(response.intent.name);
      expect(match.confidence).to.eql(response.intent.confidence);
      expect(match.correct).to.be.true;
      expect(match.message).to.eql('Ok');
    });
    it('records a failed match', () => {
      let wrongResponse = JSON.parse(JSON.stringify(response));
      wrongResponse.intent.name = 'greetings';
      wrongResponse.intent.confidence = 1;

      let match = suite.matchIntent(example, wrongResponse)
      expect(match.name).to.eql(example.expected.intent.name);
      expect(match.confidence).to.eql(response.intent.confidence);
      expect(match.correct).to.be.false;
      expect(match.message).not.to.eql('Ok');
      expect(match.best_scoring.name).to.eql(wrongResponse.intent.name);
      expect(match.best_scoring.confidence).to.eql(wrongResponse.intent.confidence);
      expect(match.best_scoring.confidence).to.be.gt(match.confidence);
    });
  })

  describe('matchEntity()', () => {
    const expected = example.expected.entities[0];
    const actualList = response.entities;
    const match = suite.matchEntity(expected, actualList);

    it('records a successful match', () => {
      expect(match.entity).to.eql(expected.entity);
      expect(match.found).to.be.true;
      expect(match.confidence).to.be.gt(0);
      expect(match.correct).to.be.true;
      expect(match.message).to.eql('Ok');
    });

    it('records a failed match', () => {
      let wrongActualList = JSON.parse(JSON.stringify(actualList));
      wrongActualList.forEach(result => {result.entity = 'unexpectedValue'});

      const match = suite.matchEntity(expected, wrongActualList);
      expect(match.entity).to.eql(expected.entity);
      expect(match.found).to.be.false;
      expect(match.confidence).to.be.undefined;
      expect(match.correct).to.be.undefined;
      expect(match.message).not.to.eql('Ok');
    });
  })

  describe('entitySeverity()', () => {
    let actualList = JSON.parse(JSON.stringify(response.entities));

    it('missed match', () => {
      let result = actualList[0];
      result.entity = null;
      result.value = null;
      result.found = false;
      result.correct = null;
      result.confidence = null;
      expect(suite.entitySeverity(result)).to.eql(3);
    });

    it('wrong match', () => {
      let result = actualList[0];
      result.found = true;
      result.correct = false;
      expect(suite.entitySeverity(result)).to.eql(3);
    });

    it('bad match', () => {
      let result = actualList[0];
      result.found = true;
      result.correct = true;
      result.confidence = suite.mediumConfidence / 2;
      expect(suite.entitySeverity(result)).to.eql(2);
    });

    it('average match', () => {
      let result = actualList[0];
      result.found = true;
      result.correct = true;
      result.confidence = (suite.mediumConfidence + suite.highConfidence) / 2;
      expect(suite.entitySeverity(result)).to.eql(1);
    });

    it('good match', () => {
      let result = actualList[0];
      result.found = true;
      result.correct = true;
      result.confidence = (1 + suite.highConfidence) / 2;
      expect(suite.entitySeverity(result)).to.eql(0);
    });
  })
})