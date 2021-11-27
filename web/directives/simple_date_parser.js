(function(angular) {
  'use strict';

  var simpleDate = function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attributes, modelCtrl) {
          var regex = /[0-9\/]/g;

          modelCtrl.$validators.simpleDate = function (modelValue) {

              //console.log("Validating " + modelValue + "  -  "  + modelCtrl.$viewValue);
              var momentDate = moment(modelCtrl.$viewValue, "MM/DD/YYYY", true);

              //console.log("Date is Valid: " + modelCtrl.$viewValue + " --- " + momentDate.isValid());

              if(!(momentDate.isValid())){
                  return false;
              }


              if ((!modelValue && (!modelCtrl.$viewValue || modelCtrl.$viewValue === ''))) {
                  return true;
              }

              var date = new Date(modelValue);

              if ((date instanceof Date) && (date.toDateString() != 'Invalid Date')) {
                  if (scope.rvDateCb) {
                      scope.rvDateCb({date: date});
                  }
                  return true;
              }

              return false;
          };

          element.on('keydown', function (e) {
              // stop user from adding '/', directive already adds 2 '/'


              //console.log("Key pressed -->  " + e.which);

              if (e.which == 191) {
                  e.preventDefault();
              }


              if ((e.keyCode != 8 && e.keyCode != 13) && (!(e.keyCode > 36 && e.keyCode < 41)) && (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57))) {
                  e.preventDefault();
              }

          });

          element.on('keyup', function (e) {

              var newval = element.val();

              if (newval.length > 10) {
                  element.val(newval.slice(0, 10));

              } else if (newval && e.keyCode != 8 ) { // ignore backspace key

                  // ignore "/" keys
                  if (e.which == 191) {
                      e.preventDefault();
                  }

                  var formattedVal = "";
                  newval = newval.replace(/\//g, "");

                  if(newval.length > 4){
                      formattedVal = newval.substring(0,2) + "/" + newval.substring(2,4) + "/" + newval.substring(4,newval.length );
                  } else if(newval.length > 2){
                      formattedVal = newval.substring(0,2) + "/" + newval.substring(2,newval.length );
                  } else {
                      formattedVal = newval;
                  }

                  modelCtrl.$setViewValue(formattedVal);
                  modelCtrl.$render();
              } else {

              }
          });
      }
    };
  };

  angular
    .module('routerApp')
    .directive("simpleDate", [simpleDate]);

})(angular);