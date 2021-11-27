(function() {
  'use strict';

  var gpGac = function() {
    return {
      restrict: 'A',
      require: '?ngModel',
      scope: {
          gpGac: "=",
          gpOptions: "=?",
          gpComponents: "=?",
          gpCity: "=?",
          gpState: "=?",
          gpZip: "=?",
          gpCallback: "&?"
      },
      link:{
        pre: function(scope, element, attributes, modelCtrl) {

          var autocomplete = new google.maps.places.Autocomplete(element[0], scope.gpGac),
            options = scope.gpOptions || { submitOnEnter: true },
            itemSelected;

          scope.gpComponents = scope.gpComponents || {
            locality: 'long_name',
            sublocality: 'long_name',
            administrative_area_level_1: 'short_name',
            neighborhood: 'long_name',
            postal_code: 'short_name'
          };
			console.log("scope.gpComponents: " + JSON.stringify(scope.gpComponents));
          var autocompleteListener = autocomplete.addListener('place_changed', function() {
            var place = this.getPlace(),
              result = {};

            if (place.address_components) {
              place.address_components.forEach(function(addrComp) {
                addrComp.types.forEach(function(type) {
                  if (scope.gpComponents && scope.gpComponents[type]) {
                    result[type] = addrComp[scope.gpComponents[type]];
                  }
                });
              });

              scope.gpState = result.administrative_area_level_1;
              if (result.locality && isOnDisplay(result.locality)) {
                scope.gpCity = result.city = result.locality;
              }
              if (result.sublocality && isOnDisplay(result.sublocality)) {
                scope.gpCity = result.city = result.sublocality;
              }
              if (result.neighborhood && isOnDisplay(result.neighborhood)) {
                scope.gpCity = result.city = result.neighborhood;
              }
              scope.gpZip = result.postal_code;

              // check if it's displayed on input
              function isOnDisplay(addrComp) {
                return place.formatted_address.search(addrComp) > -1;
              }

              scope.$apply(function () {
                if (modelCtrl) {
                  modelCtrl.$setViewValue(result[options.display] ? result[options.display] : place.formatted_address);
                } else {
                  element.val(result[options.display] ? result[options.display] : place.formatted_address);
                }
                if (scope.gpCallback) {
                  scope.gpCallback({result: result, place: place});
                }
                if (modelCtrl) {
                  modelCtrl.$render();
                }
              });
            }
          });

          var enterKeydownListener = google.maps.event.addDomListener(element[0], 'keydown', function(e) {
            if (e.keyCode === 13) {
              if (!options.submitOnEnter && itemSelected) {
                e.preventDefault();
                itemSelected = !itemSelected;
              }
            }
          });
          var enterKeyupListener = google.maps.event.addDomListener(element[0], 'keyup', function(e) {
            if (e.keyCode === 38 || e.keyCode === 40) {
              itemSelected = angular.element(document).find('.pac-item-selected').length;
            }
          });

          element.on('$destroy', function() {
            autocompleteListener.remove();
            enterKeydownListener.remove();
            enterKeyupListener.remove();
            autocomplete.unbindAll();
          });
        },
        post: function(scope, element, attributes, modelCtrl) {

        }
      }
    };
  };

  angular
    .module('routerApp')
    .directive("gpGac", ['$rootScope', gpGac]);

})();