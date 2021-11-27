(function(angular) {
  'use strict';

  angular.module('rvServices')
  .factory('curriculumService', curriculumService);

  curriculumService.$inject = ['$resource'];

  function curriculumService($resource) {
    return $resource('/api/curriculum/:curriculumId', {}, {
      update: {
        method: 'PUT'
      }
    });
  }
})(angular);