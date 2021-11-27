var articleService = angular.module('articleService', ['ngResource']);

articleService.factory('articleService', ['$resource',
    function($resource) {
        return $resource('/api/article/:userid', {}, {
            query: {
                method: 'POST',
                params: {
                    name: 'name'
                },
                isArray: false
            },
            get:{
                method:'GET',
                isArray: false,
                url:'/api/article/:userid'
            },
            remove:{
                method:'POST',
                url:'/api/article/delete'
            }
        });

    }
]);