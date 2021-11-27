(function(angular) {
  'use strict';

  angular.module('rvComponents')
    .component('rvButton', {
      bindings: {
        action: '&?',
        isDisabled: '=?',
        isLoading: '=?',
        styles: '@',
        text: '=',
        type: '@?'
      },
      controller: RVButtonController,
      templateUrl: './components/rvButton/rvButton.html',
      transclude: true
    });

  function RVButtonController() {
    var ctrl = this;

    ctrl.type = ctrl.type || 'button';
  }

  RVButtonController.$inject = []
})(angular);