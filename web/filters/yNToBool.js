angular.module('rvFilters')
  .filter('yNToBool', YNToBool);

function YNToBool() {
  return function(val) {
    if (val) {
      if (val === 'Y') return true;
      if (val === 'N') return false;
      return true;
    }
    return false;
  }
}