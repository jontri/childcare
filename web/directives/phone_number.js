(function(angular, $) {
    'use strict';

    var phoneNumber = function($filter) {
      return {
        require: 'ngModel',
        link: function(scope, element, attributes, modelCtrl) {
          modelCtrl.$validators.minlength = function(phoneNumber) {
            if(attributes.required)
            {
              if(phoneNumber !== undefined) 
              {
                if(phoneNumber.length > 0) 
                {
                  var pattern = /\([0-9]{3}\)\s{1}[0-9]{3}\-[0-9]{4}/;
                  var value = phoneNumber.toString().trim();
                  if(pattern.test(value))
                  {
                    if(phoneNumber.length === 14)
                    {
                      return true; // already in correct pattern; no need to revalidate
                    }  
                  }
                  
                  var numbers = /^[0-9]+$/;  
                  if(!value.match(numbers)) 
                  {
                    return false; // not numeric
                  }

                  if(phoneNumber.length === 10)
                  {
                    return true; 
                  }

                  return false;                  
                }
                else 
                {
                  return true; // let the required validator to kick in
                }                
              } 
              else 
              {
                return false;
              }
            }
            else if(phoneNumber !== undefined && phoneNumber.length > 0) // optional field; has input
            {
              var pattern = /\([0-9]{3}\)\s{1}[0-9]{3}\-[0-9]{4}/;
              var value = phoneNumber.toString().trim();
              if(pattern.test(value))
              {
                if(phoneNumber.length === 14)
                {
                  return true; // already in correct pattern; no need to revalidate
                }    
              }
              
              if(!/[^0-9]/.test(value))
              {
                return false; // not numeric
              }

              if(phoneNumber.length === 14)
              {
                return true; 
              }

              return false;  
            }
            else // optional field; no input
            {
              return true;
            }  
          };



          element.on('keydown', function (e) {
              // stop user from adding '/', directive already adds 2 '/'


              // console.log("Key down which -->  " + e.which);
              // console.log("Key down keyCode -->  " + e.keyCode);

              if (e.which == 191) {
                  e.preventDefault();
              }


              if ((e.keyCode != 8 && e.keyCode != 13 && e.keyCode != 9 && e.keyCode != 16) && (!(e.keyCode > 36 && e.keyCode < 41)) && (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57))) {
                  e.preventDefault();
              }

          });


          element.on('keypress', function (e) {
             // console.log("Key pressed which -->  " + e.which);
             // console.log("Key pressed keyCode -->  " + e.keyCode);

              var charCode = (e.which) ? e.which : e.keyCode;

              if (  ( charCode != 37 && charCode != 39) &&  ( charCode > 31 && (charCode < 48 || charCode > 57) ) ) {
                  e.preventDefault();
              }
          });

          var formatter = function(phoneNumber) {
            return $filter('phoneFormatter')(phoneNumber, false);
          };
  
          var parser = function(phoneNumber) {
            var formatted = $filter('phoneFormatter')(phoneNumber, false);
            modelCtrl.$setViewValue(formatted);
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
      .directive("phoneNumber", phoneNumber);
  
    phoneNumber.$inject = ['$filter'];
  
  })(angular, $);