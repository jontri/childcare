(function($) {
    'use strict';

    angular
        .module('routerApp')
        .directive('rvLoginPopup', rvLoginPopup);

    rvLoginPopup.$inject = [];

    function rvLoginPopup() {
        function link(scope, element) {
            $(element).find('#email_login, #pass_login').keypress(function(e) {
                // user presses enter key
                if (e.which == 13) {
                    $(element).find('#log-in-btn').click();
                    e.preventDefault();
                }
            });
        }

        return {
            restrict: 'E',
            controller: 'authCtrl as popup_login_ctrl',
            link: link
        }
    }

})($);
