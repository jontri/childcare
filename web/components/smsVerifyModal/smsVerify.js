(function(angular) {
  'use strict';

  angular.module('rvComponents')
    .component('smsVerifyModal', {
      bindings: {
        backdrop: '<?',
        isOpen: '=?',
        keyboard: '<?'
      },
      controller: SmsVerifyController,
      require: {
        authWrapCtrl: '^^authWrapper'
      },
      templateUrl: './components/smsVerifyModal/smsVerify.html'
    });

  function SmsVerifyController($scope, $timeout, hackService) {
    var ctrl = this;

    // sms verify modal is closed by default
    ctrl.isOpen = ctrl.isOpen || false;

    ctrl.backdrop = ctrl.backdrop || true;
    ctrl.keyboard = ctrl.keyboard || ctrl.backdrop !== 'static';

    ctrl.$onInit = function() {
      $('#smsVerifyModal').on('shown.bs.modal', function() {
        ctrl.isOpen = true;
        hackService.scrollAnim('#smsVerifyModal #verifySMSInput', true);
      }).on('hidden.bs.modal', function() {
        $timeout(function() {
          ctrl.isOpen = false;
        });
      });
    };

    $scope.$watch('$ctrl.isOpen', openModal);

    $scope.$on('showSmsVerifyModal', function() {
      $timeout(function() {
        openModal(true);
      });
    });

    function openModal(open) {
      if (open) {
        $('#smsVerifyModal').modal({
          backdrop: ctrl.backdrop,
          keyboard: ctrl.keyboard,
          show: true
        });
      } else {
        $('#smsVerifyModal').modal('hide');
      }
    }
  }

  SmsVerifyController.$inject = ['$scope', '$timeout', 'hackService'];
})(angular);