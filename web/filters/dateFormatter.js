angular.module('rvFilters')
  .filter('dateFormatter', DateFormatter);

function DateFormatter() {
  return function(str) {
    if (str) {
      str = str.split('/');
      if (str.length == 3) {
        for (var i = 0; i < 3; i++) {
          if ((str[i] = str[i].replace(/[^0-9]/g,'')).length == 1) {
            str[i] = '0'.concat(str[i]);
          }
        }
        return str.join('/');
      }
    }
    return str;
  }
}