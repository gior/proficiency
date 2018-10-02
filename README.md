Proficiency
===========
Regression test environment for [rasa_nlu](https://rasa.com/docs/nlu/). 


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
When we hit v 1.0, this will be the setup process:

Install the library

```npm install proficiency```

Modify config.json to meet your needs.
Default configuration is 
```
{
  "project": "New bot",
  "endpoints" : {
    "dev": {
      "name": "Dev",
      "url": "http://localhost:5000/parse"
    },
    "prod": {
      "name": "Production",
      "url": "https://example.com/nlu"
    }
  }
}
```

Write a regression test suite in suite.json. Use the current file as reference:
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
 - filing the sentence attribute, then
 - copying and pasting intent and entities from the response you received from rasa_nlu service, then
 - possibly removing fields like _confidence_, _extractor_, _processors_. They are not useful in this file.
 
Launch the test suite
---------------------
When we hit v 1.0, this will be the launch command:
```
proficiency <project name>
```
or
```
proficiency <project path>
```

Happy testing!
