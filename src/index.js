const projectPath =  process.argv[2];
const RegressionSuite = require('./regression-suite');

let suite = new RegressionSuite(projectPath)
suite.run().catch(e => {console.log("RegressionSuite RUN error:", e)})



