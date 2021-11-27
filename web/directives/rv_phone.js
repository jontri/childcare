(function(angular){
  'use strict';

  angular
    .module('routerApp')
    .directive('rvPhone', rvPhone);

  rvPhone.$inject = ['phoneFormatterFilter'];

  function rvPhone(phoneFormatterFilter) {

    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    }

    function link(scope, elem, attrs, modelCtrl) {
      modelCtrl.$parsers.push(phoneParser);
      modelCtrl.$formatters.push(phoneFormatter);

      function phoneParser(val) {
        return phoneFormatterFilter(val);
      }

      function phoneFormatter(val) {
        return phoneFormatterFilter(val, true);
      }
    }

  }

})(angular);