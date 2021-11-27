(function(angular) {
  'use strict';

  angular.module('rvServices')
  .factory('accreditationService', accreditationService);

  accreditationService.$inject = ['$resource'];

  function accreditationService($resource) {
    return $resource('/api/accreditation/:accreditationId', {}, {
      update: {
        method: 'PUT'
      }
    });
  }
})(angular);