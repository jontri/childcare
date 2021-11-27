(function(angular) {
  'use strict';

  angular.module('rvComponents')
    .component('loginModal', {
      bindings: {
        backdrop: '<?',
        email: '@?',
        isOpen: '=',
        keyboard: '<?'
      },
      controller: LoginController,
      require: {
        authWrapCtrl: '^^authWrapper'
      },
      templateUrl: './components/loginModal/login.html'
    });

  function LoginController($q, $scope, hackService) {
    var ctrl = this;

    // allow modals, i.e., sweetalerts, over this modal to gain focus
    hackService.allowSecondModalFocus();

    ctrl.passType = 'password';

    ctrl.backdrop = ctrl.backdrop || true;
    ctrl.keyboard = ctrl.keyboard || ctrl.backdrop !== 'static';

    var emailDeferred = $q.defer();
    var destroyEmailWatch = $scope.$watch('$ctrl.email', function(newval) {
      if (newval) {
        emailDeferred.resolve(newval);
        destroyEmailWatch();
      }
    });

    ctrl.$onInit = function() {
      // if login modal, enable/disable some functions on authCtrl
      ctrl.authWrapCtrl.authCtrl.isLoginModal = true;

      emailDeferred.promise.then(function(email) {
        ctrl.authWrapCtrl.authCtrl.user.username = email;
      });

      $('#loginModal').on('shown.bs.modal', function() {
        hackService.scrollAnim('div.login #modal_email_login', true);
        emailDeferred.promise.then(function() {
          hackService.scrollAnim('div.login #modal_pass_login', true);
        });
      });

      ctrl.authWrapCtrl.authCtrl.setCallbacks({
        wrongUsernamePass: wrongUsernamePass
      });
    };

    $scope.$watch('$ctrl.isOpen', openModal);

    $scope.$on('user-logged-in', function() {
      openModal(false);
    });

    $scope.$on('user-logged-out', function() {
      openModal(true);
    });

    ctrl.showPassword = showPassword;

    function openModal(open) {
      if (open) {
        $('#loginModal').modal({
          backdrop: ctrl.backdrop,
          keyboard: ctrl.keyboard,
          show: true
        });
      } else {
        $('#loginModal').modal('hide');
      }
    }

    function showPassword() {
      ctrl.passType = (ctrl.passType === 'password' ? 'text' : 'password');
    }

    function wrongUsernamePass() {
      hackService.scrollAnim(ctrl.email ? 'div.login #modal_pass_login' : 'div.login #modal_email_login', true);
    }
  }

  LoginController.$inject = ['$q', '$scope', 'hackService'];
})(angular);