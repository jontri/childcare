(function() {
    'use strict';

    angular
        .module('routerApp')
        .controller('messageCtrl', messageCtrl);

    messageCtrl.$inject = ['$state', '$stateParams', '$filter', 'messageService', '$scope', 'AuthService', 'appointmentService'];

    function messageCtrl($state, $stateParams, $filter, messageService, $scope, AuthService, appointmentService) {
        var self = this;

        // load contact us page with closed sms verify modal
        $scope.showSmsModal = false;

        self.emailRegex = AuthService.emailRegex;
        self.sendMessage = sendMessage;
        self.is_loading = false;
        self.is_message_sent = false;
        self.new_message = {
            sender_email: $stateParams.email,
            subject: $stateParams.subject
        };
        if (AuthService.isAuthenticated()) {
            self.new_message.sender_email = AuthService.getUser().email;;
        }

        // get subject and message
        if ($stateParams.type === 'appointment') {
            var appointment = appointmentService.get({appointmentId: $stateParams.id}, function() {
                var schedule = $filter('date')(new Date(appointment.date), "EEEE, MMM dd, yyyy 'at' h:mm a");
                if (appointment.listing) {
                    self.new_message.subject = 'Reinstate appointment with ' + appointment.listing.name;
                    self.new_message.message = 'I did not cancel my appointment with ' + appointment.listing.name + ' for ' + schedule + '. Please help reinstate my appointment.';
                }
            });
        }

        function sendMessage(message, formContactUs) {
            if (!formContactUs.$valid) {
                setTimeout(function () {
                    var firstErrorElement = angular.element("[name='" + formContactUs.$name + "']").find('[class*="ng-invalid"]:visible:first');
                    firstErrorElement.focus();
                    $("html, body").animate({scrollTop: firstErrorElement.offset().top - 300}, 1000);
                }, 1);

                return;
            }

            self.is_loading = true;
            messageService.send(message, function(response) {
                self.is_loading = false;
                self.is_message_sent = true;
                self.submitted = false;
                self.new_message = {};
                self.formContactUs.$setPristine();
                if(!$scope.$$phase) {
                    $scope.$apply();
                }
            });
        }

    }

})();
