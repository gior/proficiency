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

Create a project folder where you will store 
 - _config.json_: the configuration file, and
 - _suite.json_: the test suite.
 
For your convenience the folder `src/sample-project` contains example files that you can copy and customize.

Sample configuration is 
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
_Note_: Be sure to use the same project name you used in Rasa. 
Otherwise the NLU serivce will be unable to answer. 

Write a regression test suite in suite.json.
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
npx proficiency <project path>
```
For the time being, you must launch the script explicitly:
```  
cd <proficiency folder>       
node src/index.js <project path>
```

Happy testing!
