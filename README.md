Proficiency
===========
Regression test tool for [rasa_nlu](https://rasa.com/docs/nlu/). 


What is it for?
---------------
Proficiency allows bot developers to stay confident of the bot behaviour while its language model grows and becomes
more complex. 
Developers can
 - **define** what **intent and entites** are expected given a certain query
 - **define confidence levels** required for certain, acceptable and uncertain matches
 - get a **visual report** of the test run
 - see details of the **issues**
 
Warning
-------
In order to understand the following instructions you should be familiar with Rasa NLU and its terms. 
Please take a look at [the docs](https://rasa.com/docs/nlu/) if you feel you're missing something.


Setup
------------
Install the library

```npm install proficiency```

Create a project folder where you will store 
 - _config.json_: the configuration file, and
 - _suite.json_: the test suite.
 
For your convenience the folder `src/sample-project` contains example files that you can copy and customize.

Sample configuration is 
```
{
  "project": "new_bot",
  "endpoints" : {
    "dev": {
      "name": "Dev",
      "url": "http://localhost:5000/parse"
    },
    "prod": {
      "name": "Production",
      "url": "https://example.com:5000/parse"
    }
  },
  "highConfidence": 0.75,
  "mediumConfidence": 0.65
}
```
_Note_: Be sure to use the same project name you used in Rasa. 
Otherwise the NLU serivce will be unable to answer. 

Write regression tests in suite.json.
```
{
  "examples": [
    {
      "sentence": "Hi!",
      "expected": {
        "intent": {
          "name": "greetings"
        },
        "entities": []
      }
    },  
    {
      "sentence": "Hi Sarah!",
      "expected": {
        "intent": {
          "name": "greetings"
        },
        "entities": [
          {
            "start": 3,
            "end": 8,
            "value": "Sarah",
            "entity": "name"
          }
        ]
      }
    }
  ]
}
```
The format of each example is compatible with rasa_nlu responses. This way you can add new examples by  
 - filling the sentence attribute, then
 - copying and pasting intent and entities from the response you received from rasa_nlu service, then
 - possibly removing fields like _confidence_, _extractor_, _processors_. They are not useful in this file.
 
Launch the test suite
---------------------
```         
npx proficiency <regression test folder path>
```

Happy testing!
