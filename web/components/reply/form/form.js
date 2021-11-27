(function(angular) {
  'use strict';

  angular.module('rvComponents')
    .component('replyForm', {
      bindings: {
        onSend: '&',
        reply: '=',
        review: '='
      },
      controller: ReplyFormController,
      templateUrl: './components/reply/form/form.html'
    });

  function ReplyFormController($timeout, hackService) {
    var ctrl = this;

    var messageCopy = ctrl.reply.message;

    ctrl.cancelReply = cancelReply;

    function cancelReply() {
      swal({
        title: "Cancel " + (ctrl.reply.isEditMode ? "Changes" : "Reply") + "?",
        text: "Are you sure you want to cancel your " + (ctrl.reply.isEditMode ? "changes" : "reply") + "?",
        type: "warning",
        showCancelButton: true,
        cancelButtonText: "No",
        confirmButtonText: "Yes"
      }, function () {
        $timeout(function() {
          ctrl.reply.isEditMode = false;
          ctrl.review.newReply = null;
          ctrl.reply.message = messageCopy;
        });
      });
      hackService.scrollAnim('div.sweet-alert button.cancel', true);
    };
  }

  ReplyFormController.$inject = ['$timeout', 'hackService']
})(angular);