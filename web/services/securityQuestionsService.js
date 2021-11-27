(function() {
    'use strict';

    angular
        .module('routerApp')
        .factory('securityQuestionsService', securityQuestionsService);

    securityQuestionsService.$inject = ['$http', 'API_ENDPOINT'];

    function securityQuestionsService($http, API_ENDPOINT) {
        return {
            getListOfQuestions: getListOfQuestions,
        }

        function getListOfQuestions() {
            return $http.get(API_ENDPOINT + '/questions');
        }

    }

})();