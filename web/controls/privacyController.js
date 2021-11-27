(function(angular) {
  'use strict';

  angular
    .module('routerApp')
    .controller('privacyCtrl', privacyCtrl);

  privacyCtrl.$inject = ['$scope','$location', '$state', '$window', 'hackService'];

  function privacyCtrl($scope, $location, $state, $window, hackService) {
    var self = this;

    self.currState = $state.current.name;

    self.scrollTo = function(id) {
      hackService.scrollToHash(id, 150);
    }

    self.goToPrivacy = function(id) {
      $('#terms-use').on('hidden.bs.modal', function() {
        $('#privacy-policy').on('hidden.bs.modal', function() {
          $('#terms-use').on('shown.bs.modal', function() {
            hackService.scrollToHash(id);
            $(this).off('shown.bs.modal');
          }).modal('show');
          $(this).off('hidden.bs.modal');
        }).modal('show');
        $(this).off('hidden.bs.modal');
      }).modal('hide');
    }
  }

})(angular);