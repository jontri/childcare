(function() {
    'use strict';


    angular
        .module('routerApp')
        .factory('messageService', messageService);

    messageService.$inject = ['$resource'];

    function messageService($resource) {

        return $resource(
            '/api/message/:id/:type', {}, {
                query: {
                    method: 'GET',
                    params: {
                        category: 'category'
                    },
                    isArray: false,
                    url: '/api/message'
                },
                send: {
                    method: 'POST',
                    isArray: false
                },
                update: {
                    method: 'POST',
                    isArray: false,
                    url:'/api/messageupdate'
                }

            }
        );

    }
    
})();