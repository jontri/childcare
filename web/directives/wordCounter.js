(function(angular) {
  'use strict';

  var wordCounter = function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        wordCounter: '=',
        wordMax: '<?',
      },
      link: function(scope, element, attributes, modelCtrl) {
        var disabled;
        scope.wordCounter = scope.wordMax || 0

        var destroyViewValueWatch = scope.$watch(function() {
          return modelCtrl.$viewValue;
        }, function(newval) {
          if (newval) {
            scope.wordCounter = (scope.wordMax - countWords()) || 0;
            destroyViewValueWatch();
          }
        });

        modelCtrl.$viewChangeListeners.push(viewChanged);

        function viewChanged() {
          var numOfWords = modelCtrl.$viewValue.trim() ? countWords() : 0;
          scope.wordCounter = (scope.wordMax) ? scope.wordMax - numOfWords : numOfWords;
          disabled = numOfWords >= scope.wordMax;
        }

        function countWords() {
          return modelCtrl.$viewValue.split(/[\s\n\r\t]/g).length;
        }

        element.on('keypress', function(e) {
          // disabled when
          if (disabled && e.which === 32) e.preventDefault();
        });
      }
    };
  };

  wordCounter.$inject = [];

  angular
    .module('rvDirectives')
    .directive('wordCounter', wordCounter);

})(angular);