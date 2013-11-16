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
    function push(expected, input) {
      promises.push(resolve(input, expected))
    }

    _.each({
      '/2/2/+': '4',
      '/3/2/*': '6',
      '/2 2 +': '4',
      '/bob/sue/+': 'suebob',
      '/3/3/2/*/+': '9',
      '': '',

      '[ false ] [ true ] 0 :if': 'false',
      '[ false ] [ true ] 1 :if': 'true',
      '[ false ] [ 5 ] 1 :if': '5'
    }, push);

    Q.all(promises).then(function () {
      done()
    });
  });

  function resolve(input, output) {
    return concatenative.resolve(input)
      .done(function (result) {
        expect(result.output).to.eql(output)
      })
  }
});