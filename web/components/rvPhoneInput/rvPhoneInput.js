(function(angular) {
  'use strict';

  angular.module('rvComponents')
    .component('rvPhoneInput', {
      bindings: {
        compare: '=?',
        form: '<',
        inline: '<?',
        isRequired: '<?',
        label: '@?',
        name: '@',
        nextElem: '@?',
        value: '=',
        isDisabled: '<?'
      },
      controller: PhoneInputController,
      require: {
        modelCtrl: 'ngModel',
        modelOptsCtrl: 'ngModelOptions'
      },
      templateUrl: './components/rvPhoneInput/rvPhoneInput.html'
    });

  function PhoneInputController($element, $scope, $window) {
    var ctrl = this;

    ctrl.phone = [
      {
        name: ctrl.name + 1,
        num: ''
      },
      {
        name: ctrl.name + 2,
        num: ''
      },
      {
        name: ctrl.name + 3,
        num: ''
      }
    ];

    ctrl.modelOpts = {
      allowInvalid: true
    };
    $element.attr('ng-model-options', JSON.stringify(ctrl.modelOpts));

    $scope.$watch('$ctrl.value', function(newVal) {
      if (newVal) {
        if (newVal.length === 10) {
          ctrl.phone[0].num = newVal.substring(0, 3);
          ctrl.phone[1].num = newVal.substring(3, 6);
          ctrl.phone[2].num = newVal.substring(6, 10);
        }
      } else {
        ctrl.phone[0].num = ctrl.phone[1].num = ctrl.phone[2].num = '';
      }
    });

    $scope.$watchGroup(['$ctrl.phone[0].num', '$ctrl.phone[1].num', '$ctrl.phone[2].num'], function(newVals) {
      var newPhoneNum = (newVals[0] || '') + (newVals[1] || '') + (newVals[2] || '');
      if (newPhoneNum) {
        if (ctrl.value !== newPhoneNum) {
          ctrl.value = newPhoneNum;
          ctrl.modelCtrl && ctrl.modelCtrl.$setViewValue(newPhoneNum);
        }
      } else {
        ctrl.value = undefined;
      }
    });

    ctrl.$onInit = function() {
      if (ctrl.modelCtrl) {
        ctrl.modelCtrl.$validators.sameNum = function(modelVal) {
          return !modelVal || !ctrl.compare || (modelVal && modelVal !== ctrl.compare);
        };
        ctrl.modelCtrl.$validators.phoneLength = function(modelVal) {
          return !modelVal || (modelVal && modelVal.length === 10);
        };
      }
      if (ctrl.modelOptsCtrl) {
        angular.merge(ctrl.modelOptsCtrl.$options, ctrl.modelOpts);
      }
    };

    $element.on('phoneFocus', function(evt) {
      $element.find('input[name="'+ctrl.phone[0].name+'"]').focus();
    });

    ctrl.maxlength = maxlength;
    ctrl.validateRequired = validateRequired;

    function maxlength(e, max, pos) {
      if (e.which === 9 || e.which === 13 || e.which === 16) {
        return true;
      }

      var isBackspace = e.which === 8;
	  var isLeftArrow = e.which === 37;
	  var isRightArrow = e.which === 39;

	  if ((!isBackspace && !isLeftArrow && !isRightArrow && (e.which < 48 || e.which > 57)) || (e.shiftKey && (e.which >= 48 && e.which <= 57))) {
        return e.preventDefault();
      }

      var inputLength = (ctrl.phone[pos].num || '').length;
      if (inputLength === max - 1 || ((inputLength === 1 || !inputLength) && isBackspace)) {
        var watcher = $scope.$watch(function() {
          return (ctrl.phone[pos].num || '').length;
        }, function(newVal) {
          // focus to next element when input's pre-determined length is reached
          if (newVal === (pos === 2 ? 4 : 3) || !newVal) {
            var elem;
            if (!newVal) {
			  elem = $element.find('input[name="'+ctrl.phone[pos === 0 ? pos : pos].name+'"]');
            } else {
              elem = (pos === 2) ? $(ctrl.nextElem) : $element.find('input[name="'+ctrl.phone[pos+1].name+'"]');
            }
            elem.focus();

            // destroy watch
            watcher();
          }
        });
      } else if (inputLength >= max && !isBackspace && !isLeftArrow && !isRightArrow) {
        e.preventDefault();
      }
    }

    function validateRequired() {
      return ctrl.form.$submitted && ctrl.phone.every(function(phone) {
        return ctrl.form[phone.name].$error.required;
      }) && !ctrl.isDisabled;
    }
  }

  PhoneInputController.$inject = ['$element', '$scope', '$window'];
})(angular);