(function(angular, $) {
  'use strict';

  var rvSocialSecurity = function($filter) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attributes, modelCtrl) {
        var regex = /[0-9\-]/g,
            prevVal;

        modelCtrl.$validators.rvSocialSecurity = function(modelValue) {
          if (!modelValue) {
            return true;
          }

          if (prevVal !== modelValue) {
            var res = modelValue.match(regex);
            prevVal = '';
            if (res) {
              res.forEach(function(char) {
                prevVal = prevVal.concat(char);
              });
            }
            modelCtrl.$setViewValue(prevVal);
            modelCtrl.$render();
          }

          var formatted = $filter('ssnReverse')(modelValue);
          formatted = $filter('ssnFilter')(formatted);

          // checks for 'xxx-xx-xxxx' format
          return /[0-9]{3}\-[0-9]{2}\-[0-9]{4}/.test(formatted);
        };

        element.on('keypress', function (e) {
          /*console.log("Key pressed -->  " + e.which);
          console.log("Key pressed -->  " + e.keyCode);*/
          
          var charCode = (e.which) ? e.which : e.keyCode
          if (charCode != 45  && charCode > 31 && (charCode < 48 || charCode > 57)) {
            e.preventDefault();
          }
        });

        var formatter = function(value) {
          return $filter('ssnFilter')(value);
        };

        var parser = function(value) {
          var formatted = $filter('ssnReverse')(value);
          modelCtrl.$setViewValue($filter('ssnFilter')(formatted));
          modelCtrl.$render();
          return formatted;
        };

        modelCtrl.$formatters.push(formatter);
        return modelCtrl.$parsers.unshift(parser);
      }
    };
  };

  angular
    .module('routerApp')
    .directive('rvSocialSecurity', rvSocialSecurity)
    .filter('ssnFilter', function() {
      return function(value) {
        var len, val;
        if (value) {
          val = value.toString().replace(/\D/g, "");
          len = val.length;
          if (len < 4) {
            value = val;
          } else if ((3 < len && len < 6)) {
            value = val.substr(0, 3) + '-' + val.substr(3);
          } else if (len > 5) {
            return val.substr(0, 3) + '-' + val.substr(3, 2) + '-' + val.substr(5, 4);
          }
        }
        // console.log("Filter: " + value)
        return value;
      };
    })
    .filter('ssnReverse', function() {
        return function(value) {
            if (!!value) {
                value = value.replace(/\D/g, "").substr(0, 9);
            }
            // console.log("Reverse; " + value)
            return value;
        }
    });

  rvSocialSecurity.$inject = ['$filter'];

})(angular, $);