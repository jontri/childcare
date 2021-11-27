(function(angular) {
  'use strict';

  angular.module('rvComponents')
    .component('rvListBlock', {
      templateUrl: './components/rvListBlock/rvListBlock.html',
      transclude: true
    });
})(angular);