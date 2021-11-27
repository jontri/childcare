(function(angular){
  'use strict';

  angular
    .module('routerApp')
    .directive('rvDateFormat', rvDateFormat);

  rvDateFormat.$inject = ['$window'];

  function rvDateFormat($window) {

    return {
      restrict: 'A',
      link: link
    }

    function link($scope, $element, $attributes) {
      $attributes.$observe('rvDateFormat', function(date) {
        if (date) {
          date = date.split('/');
          if (date.length == 3) {
            for (var i = 0; i < 3; i++) {
              if ((date[i] = date[i].replace(/[^0-9]/g,'')).length == 1) {
                date[i] = '0'.concat(date[i]);
              }
            }
            $element.text(date.join('/'));
          }
        }
      });
    }

  }

})(angular);