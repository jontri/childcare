angular.module('rvServices')
  .factory('timeService', timeService);

timeService.$inject = [];

function timeService() {
  return {
    getHours: getHours,
    getMinutes: getMinutes,
    getPeriods: getPeriods
  };

  function buildNumArr(min, max, prependZero) {
    var arr = [];
    while (min <= max) {
      var numStr = min.toString();
      if (prependZero && numStr.length < 2) {
        numStr = '0' + numStr;
      }
      arr.push(numStr);
      min++;
    }
    return arr;
  }
  
  function getHours() {
    return buildNumArr(1, 12);
  }

  function getMinutes() {
    return buildNumArr(0, 59, true);
  }

  function getPeriods() {
    return ['AM', 'PM'];
  }
}