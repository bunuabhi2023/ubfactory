const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml'); // Path to your YAML file

module.exports = swaggerDocument;