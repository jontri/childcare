(function(angular) {
  angular.module('rvFilters')
    .filter('firstLastName', FirstLastName);

  function FirstLastName(capitalizeFilter) {
    return function(user, initials, middleInitial) {
      user = user || {};

      return capitalizeFilter((initials && user.firstName) ? user.firstName[0] : user.firstName) +
        (middleInitial ? (' ' + user.middleName + ' ') : ' ') +
        capitalizeFilter((initials && user.lastName) ? user.lastName[0] : user.lastName);
    };
  }
})(angular);