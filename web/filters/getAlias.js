(function(angular) {
  angular.module('rvFilters')
    .filter('getAlias', GetAlias);

  function GetAlias(firstLastNameFilter) {
    return function(user, initials, middleInitial) {
      user = user || {};

      return user.aliasName ? user.aliasName : firstLastNameFilter(user, initials, middleInitial);
    };
  }
})(angular);