(function(angular) {
  angular.module('rvFilters')
    .filter('dateToMilli', DateToMilli);

  function DateToMilli() {
    return function(date) {
      if (date) {
        return new Date(Date.parse(date.replace(/\u200E/g,'')));
      }
      return date;
    };
  }
})(angular);