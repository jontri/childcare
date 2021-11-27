var hackService = angular.module('routerApp');

hackService.factory('hackService', ['$timeout', '$anchorScroll', '$location', '$q',

  function($timeout, $anchorScroll, $location, $q) {
    return {
      scrollAnim: scrollAnim,
      scrollToHash: scrollToHash,
      scrollToTop: scrollToTop,
      bindEscapeModalSeq: bindEscapeModalSeq,
      unbindCustomEvents: unbindCustomEvents,
      bindTabbing: bindTabbing,
      allowSecondModalFocus: allowSecondModalFocus,
      tryFocusToElem: tryFocusToElem,
      waitForElem: waitForElem
    }

    function scrollAnim(selector, noScroll, offset) {
      offset = offset || 0;
      return setTimeout(function () {
          var elem = $(selector);
          if (elem.length) {
            elem.focus();
            // Commented out to remove the scroll action of search results when deleting search log
            !noScroll ? $("html, body").animate({scrollTop: elem.offset().top - 300 + offset}, 200) : null;
          }
      }, 1);
    }

    function scrollToHash(id, yOffset) {
      yOffset = yOffset || 0;
      $anchorScroll.yOffset = yOffset;
      $location.hash(id);
      $anchorScroll();
    }

    function scrollToTop() {
      setTimeout(function () {
        $("html, body").animate({scrollTop: 0}, 200);
      }, 1);
    }

    function bindEscapeModalSeq(modal) {
      $(document).keyup(function(e) {
        // escape key is pressed
        if (e.keyCode == 27) {
          if ($('div.sweet-alert').hasClass('hideSweetAlert')) {
            $(modal).modal('hide');
          } else {
            swal.close();
          }
        }
      });

      return 'keyup';
    }

    function unbindCustomEvents(events) {
      $(document).off(events);
    }

    function bindTabbing(elemsToTab) {
      $(document).keyup(function(e) {
        // tab key is pressed
        if (e.keyCode == 9) {
          var elemToFocus = elemsToTab.shift();
          $(elemToFocus).focus();
          elemsToTab.push(elemToFocus);
          e.preventDefault();
        }
      })
      .keydown(function(e) {
        if (e.keyCode == 9) {
          e.preventDefault();
        }
      })
      .keypress(function(e) {
        if (e.keyCode == 9) {
          e.preventDefault();
        }
      });

      return 'keyup keydown keypress';
    }

    // hack to solve focus problems when sweetalert goes on top of bootstrap modal
    function allowSecondModalFocus() {
      $(document).off('focusin').on('focusin', function(e) {
        e.stopImmediatePropagation();
      });
    }

    function tryFocusToElem(selector, scrollTo) {
      waitForElem(selector).then(function(elem) {
        elem.focus();
        if (scrollTo) {
          scrollAnim(selector);
        }
      });
    }

    function waitForElem(selector) {
      var deferred = $q.defer();

      var interval = setInterval(function() {
        var elem = $(selector);
        if (elem.length) {
          clearInterval(interval);
          deferred.resolve(elem);
        }
      }, 100);

      return deferred.promise;
    }
  }
]);