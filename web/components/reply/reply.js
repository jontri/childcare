(function(angular) {
  'use strict';

  angular.module('rvComponents')
    .component('reply', {
      bindings: {
        highlightProfanities: '<?',
        reply: '='
      },
      controller: ReplyController,
      templateUrl: './components/reply/reply.html',
      transclude: {
        'actions': '?actions'
      }
    });

  function ReplyController() {
    var ctrl = this;
  }

  ReplyController.$inject = []
})(angular);