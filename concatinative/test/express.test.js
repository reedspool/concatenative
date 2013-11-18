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
      // Basic arithmetic
      '/2/2/+': '4',
      '/3/2/*': '6',
      '/2 2 +': '4',
      // javascript-like + operator
      '/bob/sue/+': 'suebob', 
      
      // Composition
      '/3/3/2/*/+': '9',

      // Base case empty string input
      '': '',

      // Quotations
      '[ 2 ]': '[ 2 ]',
      '[ abcd ]': '[ abcd ]',
      '5 :quote': '[ 5 ]',

      // Composition of quotations
      '[ [ 2 2 + ] ]': '[ [ 2 2 + ] ]',
      '[ [ abc efg + ] :apply ]': '[ [ abc efg + ] :apply ]',

      // Application of quotations
      '[ 2 2 + ] :apply': '4',
      '3 [ 3 * ] :apply': '9',

      // Application of composition of quotations
      '[ [ 2 2 + ] :apply ] :apply': '4',
      '[ 4 ] :apply :quote': '[ 4 ]',
      '[ [ 2 2 + ] :quote :apply ] :apply': '4',

      // Conditional branching
      '[ false ] [ true ] 0 :if': 'false',
      '[ false ] [ true ] 1 :if': 'true',
      '[ false ] [ 5 ] 1 :if': '5',

      // JS Math pass-through
      '4 5 :max': '5',
      '-1 300 :max': '300',

      // Links
      '[ www.google.com ] http :link': '[ www.google.com ] http :link',

      '': 'should finally fail here'
    }, push);

    Q.all(promises).then(function () {
      done()
    }, function (error) {
      console.error('Error')
      console.error(error);
      return error;
    }).done();
  });

  function resolve(input, output) {
    return concatenative.resolve(input)
      .then(function (result) {
        expect(result.output).to.eql(output)
      }, function (error) {
        console.log(error);
        throw error;
      })
  }
});