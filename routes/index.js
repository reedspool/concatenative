
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { 
  	title: 'Concatinative URL Language',
  	description: 'Work in progress.'
  });
};