var expect = require('expect.js');
var _ = require('underscore');
var sys = require('sys');
var Q = require('q');

var Utility = require('../lang-utility.js');
var log = Utility.log;

var concatenative = require('../lang.js');

describe('executor', function(){

  it('deterministic', function(done){
    var promises = [];

    _.each({
      '/2/2/+': '4',
      '/3/2/*': '6',
      '/bob/sue/+': 'suebob',
      '/3/3/2/*/+': '8',
      '': ''
    }, function (expected, input) {
      promises.push(
        concatenative.resolve(input)
          .then(function (result) {
            return { 
              input: input,
              result: result,
            }
          })
      );
    });

    Q.all(promises) 
      .done(function (results) {
        _.each(results, function (r)  {
          log('Result:', r)
          expect(r.output).to.equal(r.expected);
        });
        done();
      });
  });

});