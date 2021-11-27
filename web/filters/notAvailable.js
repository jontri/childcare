angular.module('rvFilters')
  .filter('notAvailable', NotAvailable);

function NotAvailable(COMMON) {
  return function(val, short) {
    if (val) {
      if (val instanceof Array && !val.length) {
        return !short ? COMMON.notAvailable : COMMON.NA;
      }
      return val;
    }
    return !short ? COMMON.notAvailable : COMMON.NA;
  }
}