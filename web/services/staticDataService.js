(function() {
    'use strict';

    angular
        .module('routerApp')
        .factory('StaticDataService', StaticDataService);

    StaticDataService.$inject = [];

    function StaticDataService() {
        return {
            getListOfMonths: getListOfMonths,
            getListOfDays: getListOfDays,
            getListOfYears: getListOfYears,
            generateChildData: generateChildData,
            calculateAge: calculateAge
        }
        function getListOfMonths() {
            return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        }

        function getListOfDays() {
            var days = [];
            for (var i = 1; i <= 31; i++) {
                days.push(i);
            }

            return days;
        }

        function getListOfYears(startYear) {
            var y = 1900
            if(startYear){
                y = startYear;
            }
            var today = new Date();
            var year = today.getFullYear();

            var years = [];
            for (var i = y; i <= year; i++) {
                years.push(i);
            }

            return years;
        }

        function generateChildData() {
            return {
                birth: {
                    month: 'Jan',
                    day: 1,
                    year: 1970
                },
                gender: 'Female',
                attends_daycare: 'yes',
                daycare: {
                    address: {},
                    verify: 'yes',
                    administrator: '',
                    address_is_refreshed: true,
                    selected_state: []
                },
                show_daycare_dropdown: true,
                show_daycare_fields: false
            }
        }

        function calculateAge(birthday) { // birthday is a date
            var ageDifMs = Date.now() - birthday.getTime();
            var ageDate = new Date(ageDifMs); // miliseconds from epoch
            return Math.abs(ageDate.getUTCFullYear() - 1970);
        }

    }

})();
