(function(angular) {
  'use strict';

  angular.module('rvComponents')
    .component('review', {
      bindings: {
        highlightProfanities: '<?',
        review: '='
      },
      controller: ReviewController,
      templateUrl: './components/review/review.html',
      transclude: {
        'actions': '?actions',
        'daycare': '?daycareDetails',
        'user': '?userDetails'
      }
    });

  function ReviewController() {
    var ctrl = this;
  }

  ReviewController.$inject = []
})(angular);