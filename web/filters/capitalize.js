angular.module('rvFilters')
  .filter('capitalize', Capitalize);

function Capitalize() {
  function capitalizer(word) {
    return word.charAt(0).toUpperCase().concat(word.substring(1, word.length));
  }

  return function(str) {
    str = str || '';

    if (str.length) {
      var delimiter = ' ';
      var words = str.split(delimiter);
      words.forEach(function(word, index) {
        words[index] = capitalizer(word);
      });
      return words.join(delimiter);
    }

    return '';
  }
}