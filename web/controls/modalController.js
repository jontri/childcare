(function(){
    'use strict';

    angular
        .module('routerApp')
        .controller('ModalCtrl', ModalCtrl);

    ModalCtrl.$inject = [
                                '$rootScope',
                                '$scope',
                                '$state',
                                'AuthService',
                                'messageService'
                            ];

    function ModalCtrl(
                            $rootScope,
                            $scope,
                            $state,
                            AuthService,
                            messageService
                        ) {
        var vm = this;
        var modal_model = {};
        var state = $state.current.name;
        var user = angular.copy(AuthService.getUser());
        vm.is_logged_in = angular.isDefined(user);
        vm.proxy = user;
        vm.emailRegex = AuthService.emailRegex;


        vm.sendMessage = sendMessage;
        vm.initModalSendMessage = initModalSendMessage;

        // listen for events my dear
        $rootScope.$on('open-modal', function(e, event) {

            state = $state.current.name;
            modal_model = angular.copy($rootScope.currentModalModel);

            vm.current_modal = $rootScope.currentModal;

            vm.is_loading = false;
            vm.is_message_sent = false;
            vm.submitted = false;
            vm.new_message = angular.extend({sender_email:vm.is_logged_in?user.email:''}, modal_model);

            // check that there is no current $digest process to prevent error when using $apply
            if(!$scope.$$phase) {
                $scope.$apply();
            }

        });

        function sendMessage(new_message, formSendMessage) {
            vm.submitted = true;

            if (!formSendMessage.$valid) {
                setTimeout(function () {
                    var firstErrorElement = angular.element("[name='" + formSendMessage.$name + "']").find('[class*="ng-invalid"]:visible:first');
                    firstErrorElement.focus();
                }, 1);

                return;
            }

            if(vm.is_logged_in){
                new_message.sender_id = user._id;
                new_message.status = "sent";
            }else{
                if(new_message.emailUnauth!=undefined||new_message.emailUnauth!=''){
                    //new_message.sender_email = new_message.emailUnauth;
                    console.log("UNAUTHENTICATED USER : BLANK");
                }
                new_message.sender_id = "UNAUTHENTICATED USER";
            }
            new_message.status = "sent";
            messageService.send(new_message, function(response) {
                setTimeout(function () {
                    $("#modalSendMessage .close").click();
                }, 2000);
                //swal here
                swal("Sent!", "Message Successfully Sent!", "success");

                vm.is_loading = false;
                vm.is_message_sent = true;
                vm.new_message = {};
                vm.formSendMessage.$setPristine();
                vm.submitted = false;
                if(!$scope.$$phase) {
                    $scope.$apply();
                }
            });

            //$('#modalSendMessage').delay(4000).fadeOut('slow');
            //$('#modalSendMessage').modal('hide');

        }

        function initModalSendMessage() {
            $('#modalSendMessage').off('shown.bs.modal').on('shown.bs.modal', function () {
                $(this).find('input[name="subject"]').focus();
            });
        }

    }



})();
