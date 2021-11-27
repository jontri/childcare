angular.module('rvFilters')
  .filter('linebreakToBrTag', LinebreakToBrTag);

function LinebreakToBrTag($sce) {
  return function(str) {
    str = (str && str.$$unwrapTrustedValue) ? str.$$unwrapTrustedValue() : (str || '');
    var br = '<br>';
    for (var i = 0; i < str.length; i++) {
      if (str.charAt(i) === '\n') {
        var start = str.slice(0, i);
        var end = str.slice(i+1);
        str = start.concat(br).concat(end);
        i += br.length - 1;
      }
    }
    return $sce.trustAsHtml(str);
  };
}