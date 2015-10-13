(function(document) {
  'use strict';
  console.log('\'Allo \'Allo!');
  document.getElementById('splendid').addEventListener('click', function (e) {
    e.target.text = new Date();
  });
})(document);
