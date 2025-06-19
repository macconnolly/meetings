const assert = require('assert');
const schema = require('../../config/schema.js');
const sampleData = require('../fixtures/sample-meeting-data.json');
const Validator = require('jsonschema').Validator;

describe('Schema Validation', () => {
  it('should validate complete meeting data', () => {
    const validator = new Validator();
    const result = validator.validate(sampleData, schema.schema);
    assert.ok(result.valid, `Validation failed: ${result.errors}`);
  });
});
