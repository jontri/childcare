angular.module('rvFilters')
  .filter('yesNo', YesNo);

function YesNo(COMMON) {
  return function(val) {
    if (val) {
      if (val instanceof Array) {
        return val.length ? COMMON.yes : COMMON.no;
      }
      if (typeof val === 'string') {
        return val === 'Y' ? COMMON.yes : COMMON.no;
      }
      return COMMON.yes;
    }
    return COMMON.no;
  }
}