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
      '5': '5',
      '2 2': '2 2',

      // Quotations
      '[ 2 ]': '[ 2 ]',
      '[ abcd ]': '[ abcd ]',
      '5 :quote': '[ 5 ]',

      // Append quotations together
      '[ 5 ] [ 2 ] :append': '[ 5 2 ]',
      '[ 5 2 ] [ + ] :append :call': '7',
      '[ 5 2 ] [ 3 4 ] 7 :quote :append :append' : '[ 5 2 3 4 7 ]',

      // Composition of quotations
      '[ [ 2 2 + ] ]': '[ [ 2 2 + ] ]',
      '[ [ abc efg + ] :call ]': '[ [ abc efg + ] :call ]',

      // Application of quotations
      '[ 2 2 + ] :call': '4',
      '3 [ 3 * ] :call': '9',

      // Application of composition of quotations
      '[ [ 2 2 + ] :call ] :call': '4',
      '[ 4 ] :call :quote': '[ 4 ]',
      '[ [ 2 2 + ] :quote :call ] :call :call': '4',

      // Conditional branching
      '[ false ] [ true ] !falseness :if': 'false',
      '[ false ] [ true ] 1 :if': 'true',
      '[ false ] [ 5 ] 1 :if': '5',

      // JS Math pass-through
      '4 5 :max': '5',
      '-1 300 :max': '300',

      // Dup
      '5 :dup' : '5 5',
      '[ 2 3 + ] :dup': '[ 2 3 + ] [ 2 3 + ]',
      '[ 2 3 + ] :dup :call': '[ 2 3 + ] 5',

      // Times
      '0 [ 5 ] :times': '',
      '1 [ 5 ] :times': '5',
      '2 [ 5 ] :times': '5 5',
      
      // Properties
      //   set
      'a 5 b<<': 'a',

      //   get
      'a 5 b<< b>>': '5',

      //   no crossover
      'a 5 b<< b>> a b>>': '5 !NoPropertyValue',

            // Links
        // Creation
      '[ www.google.com ] http :link': '[ www.google.com ] http :link',
        // :get
      '[ en.wikipedia.org/w/api.php?format=json&action=query&titles=Adolf_Hitler&prop=revisions&rvprop=content ] http :link json :get query>> normalized>> 0>> from>>': 'Adolf_Hitler',
    }, push);

    Q.all(promises).then(function () {
      done()
    }, function (error) {
      console.error('Error')
      console.error(error);
      return error;
    }).done();
  });

  it('non-deterministic', function (done) {
    // TODO: Test :random
    done()
  });

  function resolve(input, expected) {
    return concatenative.resolve(input)
      .then(function (result) {
        var actual = result.outputTokens.join(' ');
        expect(actual).to.eql(expected)
      }, function (error) {
        console.log(error);
        throw error;
      })
  }
});