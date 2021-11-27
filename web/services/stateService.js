var stateService = angular.module('stateService', []);

stateService.service('stateService', StateService);

StateService.$inject = ['$http', '$q', 'API_ENDPOINT'];

function StateService($http, $q, API_ENDPOINT) {
    var stateService = {
        getLatLng: function(fullAddress) {


            var defer = $q.defer();

            $http.get(API_ENDPOINT + '/getLatLng?address=' + fullAddress)
                .then(function (response) {
                    defer.resolve(response);
                }, function (err) {
                    defer.reject(err);
                });

            return defer.promise;

        },

        getListOfStates: function () {
            var defer = $q.defer();

            $http.get(API_ENDPOINT + '/states')
                .then(function (response) {
                    defer.resolve(response)
                }, function (err) {
                    defer.reject(err);
                });


            return defer.promise;
        },

        getCityAndStateByZipCode: function() {
            var defer = $q.defer();
            $http.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + zip)
                .then(function(response) {
                    defer.resolve(response);
                }, function(err) {
                    defer.reject(err);
                });
            return defer.promise;
        }

    };

    return stateService;

}