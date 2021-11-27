(function(angular) {
  'use strict';

  angular.module('rvComponents')
    .component('timeSelector', {
      bindings: {
        isDisabled: '=',
        name: '@',
        time: '='
      },
      controller: TimeSelectorController,
      templateUrl: './components/timeSelector/timeSelector.html'
    });

  function TimeSelectorController($scope, timeService) {
    var ctrl = this;

    var defaultHour = '',
      defaultMinute = '',
      defaultPeriod = '';

    ctrl.hours = timeService.getHours();
    ctrl.minutes = [defaultMinute].concat(timeService.getMinutes());
    ctrl.periods = [defaultPeriod].concat(timeService.getPeriods());

    // 1:00 AM = ['1', '00', 'AM']
    ctrl.timeArr = [defaultHour, defaultMinute, defaultPeriod];

    $scope.$watchGroup(['$ctrl.timeArr[0]', '$ctrl.timeArr[1]', '$ctrl.timeArr[2]'], function(newVals, oldVals) {
      if (newVals[0] !== oldVals[0] || newVals[1] !== oldVals[1] || newVals[2] !== oldVals[2]) {
        if (newVals[0] === defaultHour || newVals[1] === defaultMinute || newVals[2] === defaultPeriod) {
          if (ctrl.time) ctrl.time = '';
          if (ctrl.timeArr[0]) ctrl.timeArr[0] = '';
          if (ctrl.timeArr[1]) ctrl.timeArr[1] = '';
          if (ctrl.timeArr[2]) ctrl.timeArr[2] = '';
        } else {
          ctrl.time = newVals[0] + ':' + newVals[1] + ' ' + newVals[2];
        }
      }
    });

    $scope.$watch('$ctrl.time', function(newVal) {
      setTimeArr(newVal);
    }, true);

    function setTimeArr(time) {
      if (time) {
        // 1:00 AM => ['1:00', 'AM']
        var timeAndPeriod = time.split(' ');
        // if no space between 1:00 and AM
        if (timeAndPeriod.length === 1) {
          var splitPos = timeAndPeriod[0].search(/(a|p)m/i);
          timeAndPeriod.push(timeAndPeriod[0].substring(splitPos));
          timeAndPeriod[0] = timeAndPeriod[0].substring(0, splitPos);
        }
        // ['1:00', 'AM'] => [['1', '00'], 'AM']
        timeAndPeriod[0] = timeAndPeriod[0].split(':');
        ctrl.timeArr[0] = timeAndPeriod[0][0];
        ctrl.timeArr[1] = timeAndPeriod[0][1];
        ctrl.timeArr[2] = timeAndPeriod[1];
      } else {
        ctrl.timeArr[0] = ctrl.timeArr[1] = ctrl.timeArr[2] = '';
      }
    }
  }

  TimeSelectorController.$inject = ['$scope', 'timeService'];
})(angular);