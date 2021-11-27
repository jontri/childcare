angular.module('rvFilters')
  .filter('hoursOfOp', HoursOfOp);

function HoursOfOp(COMMON) {
  function formatHours(obj) {
    COMMON.longDays.forEach(function(val) {
      obj[val] = (obj[val] ? obj[val] : 'Closed');
    });
  }

  return function(obj) {
    obj.openHours ? formatHours(obj.openHours) : null;
    obj.closeHours ? formatHours(obj.closeHours) : null;
    return (!obj.openHours && !obj.closeHours ? null : obj);
  }
}