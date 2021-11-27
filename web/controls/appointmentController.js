"use strict";

var appointmentController = angular.module('appointmentController', ['ui.bootstrap']);

appointmentController.controller('appointmentController', Appointment);

Appointment.$inject = ['AuthService', 'reviewService', '$state', '$stateParams', '$scope', 'listingService','appointmentService', '$filter'];

function Appointment(AuthService, reviewService, $state, $stateParams, $scope, listingService,appointmentService, $filter) {
    console.log("appointmentController Init");
    var vm = this;

    $scope.appointmentDate;    // Primary Date object to pass to the server
    $scope.dt = new Date();             // Date object to transform and passed to appointment once finalized
    $scope.timeSlot = [];               // Array of Timeslots users can choose from
    $scope.businessOpen = 7;       // initial opening hour; predefined but not a constant
    //$scope.businessHours = 12;          // initial business hours; predefined but not a constant
    vm.scheduledAppointment = [];
    $scope.originalTimeSlot;
    $scope.selectedSlot = null;

    vm.init = function(){
        if (!AuthService.isAuthenticated()) {
            vm.isLoginModalOpen = true;
            vm.email = $stateParams.email;
        } else {
            vm.userId = AuthService.getUser()._id;
        }
        vm.listingId = $stateParams.listingId;
        vm.listingName = $stateParams.listingName;
        
        appointmentService.query({userId: vm.userId, listingId: vm.listingId}, function(result) {
            if (result.length) {
                $scope.appointment = result[0];
                $scope.originalTimeSlot = new Date($scope.appointment.date);

                // console.log("Is past date? " + $scope.originalTimeSlot + " - " + $scope.isPastDate($scope.originalTimeSlot));

                if($scope.appointment.status === "cancelled" || $scope.isPastDate($scope.originalTimeSlot) ){
                    $scope.appointment.date = new Date();
                } else {
                    $scope.appointment.date = new Date($scope.appointment.date);
                    $scope.appointmentTime = $scope.appointment.date;
                }

                $scope.appointmentDate = $scope.dt = $scope.appointment.date;
                // make $watch on 'dt' not set $scope.appointmentDate and $scope.appointmentTime to null
                $scope.initialization = true;

            }
        });


        if(!vm.scheduledAppointment || vm.scheduledAppointment.length == 0) {
            appointmentService.query({userId: vm.userId}, function (result) {
                if (result.length) {
                    result.forEach(function (appt) {

                        if (appt.listing.id == vm.listingId) {

                        } else if (appt.status != "cancelled") {
                            vm.scheduledAppointment.push(appt.date);
                        }
                    });
                }
            });
        }
        vm.emailDate = null;
    }

    vm.init();

    $scope.isAvailableSchedule = function(timeSlot){
        var isAvailable = true;

        vm.scheduledAppointment.forEach(function (appt) {

            var date1 = moment.utc(timeSlot, "YYYY-MM-DD  HH:mm:ss");
            var date2 = moment.utc(appt, "YYYY-MM-DD  HH:mm:ss");

            if(date1.isSame(date2)){
                isAvailable = false;
            }

        });
        
        return isAvailable;
    }


    $scope.isOriginalSchedule = function(timeSlot){
        var isOriginalSchedule = false;

        var date1 = moment.utc(timeSlot, "YYYY-MM-DD  HH:mm:ss");
        var date2 = moment.utc($scope.originalTimeSlot, "YYYY-MM-DD  HH:mm:ss");

        if(date1.isSame(date2)){
            isOriginalSchedule = true;
        }

        return isOriginalSchedule;
    }

    $scope.validateDate = function(){

        vm.errorDateFormat = false;
        vm.errorDate = false;

        if (!$scope.isValidDateFormat(angular.element($('#inputDt')).val())){
            vm.errorDateFormat = true;
            return;
        }

        if (!vm.errorDateFormat && !$scope.isValidDate($scope.dt)){
            vm.errorDate = true;
            return;
        }
    }


    $scope.submitSched = function(){

        vm.errorTime = false;
        vm.pastDate = false;
        vm.errorDate = false;
        vm.errorDateFormat = false;
        vm.scheduleTaken = false;
        vm.emailDate = null;
        vm.existingEmailDate = null;
        vm.noTimeslotAvailable = false;

        if (!$scope.isValidDateFormat(angular.element($('#inputDt')).val())){
            vm.errorDateFormat = true;
            return;
        }

        if (!vm.errorDateFormat && !$scope.isValidDate($scope.dt)){
            vm.errorDate = true;
            return;
        }

        var selectedDate = $scope.dt;
        selectedDate.setHours(18,0,0,0);

        if ($scope.isPastDate(selectedDate)){
            vm.pastDate = true;
            $scope.getNextAvailableSlot();
            return;
        }

        if (!vm.pastDate && $scope.isPastDate($scope.appointmentDate)){
            vm.pastDate = true;
            $scope.getNextAvailableSlot();
            return;
        }

        if($scope.bookedSlotsCtr >= 12){
            vm.noTimeslotAvailable = true;
            $scope.getNextAvailableSlot();
            return;
        }

        if(!$scope.appointmentDate || !$scope.selectedSlot){
            vm.errorTime = true;
        } else if (!vm.errorDate && !vm.pastDate) {

            if($scope.isAvailableSchedule($scope.appointmentDate)) {
                vm.scheduleTaken = false;

                vm.errorTime = false;
                var body = {
                    listing: vm.listingId,
                    listingName: vm.listingName,
                    user: vm.userId,
                    date: $scope.appointmentDate,
                    emailDate: $filter('date')($scope.appointmentDate, "EEEE, MMM dd, yyyy 'at' h:mm a"),
                    status: 'pending'
                }

                if ($scope.appointment) {
                    if ($scope.originalTimeSlot.getTime() !== $scope.appointmentDate.getTime() || $scope.appointment.status === "cancelled" ) {
                        console.log("UpdatingSchedule: " + JSON.stringify(body));

                        appointmentService.put({appointmentId: $scope.appointment._id}, body, function () {
                            vm.emailDate = body.emailDate;
                            $scope.appointment.date = body.date;
                            $scope.appointment.status = body.status;
                        });


                        $scope.originalTimeSlot = $scope.appointmentDate;
                    } else {
                        console.log("Submitting the same appointment: " + $scope.appointmentDate);
                        vm.emailDate = body.emailDate;
                        vm.existingEmailDate = body.emailDate;
                    }
                } else {

                    console.log("SubmittingSchedule: " + JSON.stringify(body));

                    appointmentService.schedule(body, function (_res) {
                        console.log(_res)
                        if (_res) {
                            $scope.appointment = _res;
                            $scope.appointment.date = new Date($scope.appointment.date);
                            vm.emailDate = body.emailDate;
                        }
                    });
                }
            } else {
                vm.scheduleTaken = true;
            }
        }
    }

    $scope.cancelSched = function() {

        vm.errorTime = false;
        vm.pastDate = false;
        vm.errorDate = false;
        vm.errorDateFormat = false;
        vm.scheduleTaken = false;
        vm.emailDate = null;
        vm.noTimeslotAvailable = false;

        appointmentService.query({userId: vm.userId, listingId: vm.listingId}, function(result) {

            if (result.length) {
                $scope.appointment = result[0];
                $scope.originalTimeSlot = new Date($scope.appointment.date)
                $scope.appointmentTime = $scope.appointment.date;
                $scope.appointmentDate = $scope.dt = $scope.appointment.date;
                $scope.appointment.date = new Date($scope.appointment.date);

                var body = {
                    listing: vm.listingId,
                    listingName: vm.listingName,
                    user: vm.userId,
                    emailDate: $filter('date')($scope.originalTimeSlot, "EEEE, MMM dd, yyyy 'at' h:mm a"),
                    status: 'cancelled'
                };
                console.log("CancellingSchedule: " + JSON.stringify(body));
                appointmentService.put({appointmentId: $scope.appointment._id}, body, function () {
                    $scope.appointment.status = body.status;
                    vm.emailDate = body.emailDate;
                });
            }

        });


    }

    $scope.isPastDate = function (dateValue) {

        var momentAppointmentDate = moment(dateValue, "MM/DD/YYYY", true);
        var momentCurrentDate = moment(new Date(), "MM/DD/YYYY", true);

        return momentAppointmentDate.isBefore(momentCurrentDate);

    }

    $scope.getNextAvailableSlot = function () {

        var momentEndOfDay = moment(new Date(), "MM/DD/YYYY", true);
        var momentCurrentDate = moment(new Date(), "MM/DD/YYYY", true);
        momentEndOfDay.set({h: 18, m: 0});

        if( momentEndOfDay.isBefore(momentCurrentDate) ){
            var today = new Date();
            $scope.nextAvailableSlot = new Date();
            $scope.nextAvailableSlot.setDate(today.getDate()+1);
            $scope.nextAvailableSlot.setHours(7,0,0,0);
        } else {
            $scope.nextAvailableSlot = new Date();
        }
    }

    $scope.isValidDate = function (dateValue) {

        // console.log("Validating " + dateValue );
        var momentDate = moment(dateValue, "MM/DD/YYYY", true);

       //console.log("Date is Valid: " + dateValue + " --- " + momentDate.isValid());

        if(!(momentDate.isValid())){
            return false;
        }


        if ((!dateValue && (!modelCtrl.$viewValue || modelCtrl.$viewValue === ''))) {
            return true;
        }

        var date = new Date(dateValue);

        if ((date instanceof Date) && (date.toDateString() != 'Invalid Date')) {

            return true;
        }

        return false;
    };

    $scope.isValidDateFormat = function (dateValue) {

        var date_regex = /^\d{2}\/\d{2}\/\d{4}$/ ;

        if(date_regex.test(dateValue)){
            return true;
        } else {
            return false;
        }
    };

    // generate timeslots; simulated
    $scope.getTimeSlots = function (refTime) {
        //use pre-defined timeslots

        var slots = [];
        // var startHour = refTime.getHours();
        var startHour = $scope.businessOpen;

        // console.log("preStartHour:" + startHour);
        if (startHour <= $scope.businessOpen) startHour = $scope.businessOpen;
        //if (startHour >= $scope.businessHours) return slots;
        // console.log("postStartHour:" + startHour);

        $scope.pastSlotsCtr = 0;
        $scope.bookedSlotsCtr = 0;

        if (AuthService.isAuthenticated()) {
            vm.userId = AuthService.getUser()._id;
        }

        appointmentService.query({userId: vm.userId}, function (result) {

            if (result.length) {
                result.forEach(function (appt) {

                    if (appt.listing.id == vm.listingId) {

                    } else if (appt.status != "cancelled") {
                        vm.scheduledAppointment.push(appt.date);
                    }
                });
            }

            for (var i = startHour; i <= 5 + startHour; ++i) {
                //var tmpD = new Date();
                // make a copy by value
                var tmpD = new Date(refTime.toString());
                var tmpE = new Date(refTime.toString());
                tmpD.setHours(i, 0, 0, 0);
                tmpE.setHours(i + 6, 0, 0, 0);
                slots.push(tmpD);
                slots.push(tmpE);

                if ($scope.isPastDate(tmpD)) {
                    $scope.pastSlotsCtr++;
                }


                if ($scope.isPastDate(tmpE)) {
                    $scope.pastSlotsCtr++;
                }

                if (!$scope.isAvailableSchedule(tmpD)) {
                    $scope.bookedSlotsCtr++;
                }


                if (!$scope.isAvailableSchedule(tmpE)) {
                    $scope.bookedSlotsCtr++;
                }

            }

            // console.log("Non Available Slots: " + pastSlotsCtr );

            // if (pastSlotsCtr >= 12) {
            //     slots = [];
            // }

            $scope.timeSlot = slots;
        });


    }
    
    $scope.chooseTimeSlot = function(slot) {

        if($scope.isAvailableSchedule(slot)) {
            var tmpD = slot.getHours();
            $scope.appointmentDate = slot;
            $scope.appointmentTime = slot;
            vm.errorTime = false;
        } else {
            return;
        }
        $scope.selectedSlot = slot;
    }

    if ($scope.timeSlot.length > 0 && $scope.timeSlot != null) {
        $scope.chooseTimeSlot($scope.timeSlot[0]);
    }


    $scope.now = function() {
        return new Date();
    };

    $scope.clear = function() {
        $scope.dt = null;
    };

    $scope.inlineOptions = {
        customClass: getDayClass,
        minDate: new Date(),
        showWeeks: true
    };

    $scope.dateOptions = {
        //dateDisabled: disabled,
        formatYear: 'yy',
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
    };

    // Disable weekend selection
    function disabled(data) {
        var date = data.date,
            mode = data.mode;
        return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
    }

    $scope.open1 = function() {
        $scope.popup1.opened = true;

        setTimeout(function () {
            $('#inputDt').focus();
        }, 3);
    };

    // $scope.keyUp = function(e) {
    //     // console.log("Pressed " + e.keyCode);
    //     if(e.keyCode == 27 ){
    //         console.log("Pressed esc key");
    //         $scope.popup1.opened = false;
    //     }
    // }

    $scope.setDate = function(year, month, day) {
        $scope.dt = new Date(year, month, day);
    };

    $scope.compareDates = function(date1, date2) {
        return date1.getTime() === date2.getTime();
    }

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'fullDate', 'shortDate'];
    $scope.format = $scope.formats[2];
    $scope.altInputFormats = ['M!/d!/yyyy'];

    $scope.popup1 = {
        opened: false
    };

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var afterTomorrow = new Date();
    afterTomorrow.setDate(tomorrow.getDate() + 1);
    $scope.events = [{
        date: tomorrow,
        status: 'full'
    }, {
        date: afterTomorrow,
        status: 'partially'
    }];

    function getDayClass(data) {
        var date = data.date,
            mode = data.mode;
        if (mode === 'day') {
            var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

            for (var i = 0; i < $scope.events.length; i++) {
                var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

                if (dayToCheck === currentDay) {
                    return $scope.events[i].status;
                }
            }
        }

        return '';
    }
    function isSameDay(date1,date2){
        var d1 = date1.getFullYear() +"-"+date1.getMonth()+"-"+date1.getDate();
        var d2 = date2.getFullYear() +"-"+date2.getMonth()+"-"+date2.getDate();
        //console.log(d1+" === "+d2);
        return d1==d2;
    }

    $scope.$watch('dt', function(newValue, oldValue, scope) {

        // vm.errorTime = false;
        // vm.pastDate = false;
        // vm.errorDate = false;
        // vm.errorDateFormat = false;
        // vm.scheduleTaken = false;
        // vm.emailDate = null;
        // vm.existingEmailDate = null;
        // vm.noTimeslotAvailable = false;

        console.log("change detected");
        $scope.timeSlot = [];
        var today = new Date();
        var refTime = new Date();

        if( (newValue instanceof Date ) ){

            if(!isSameDay(newValue,today)){
                today = new Date(newValue.toString());
                today.setHours(0,0,0,0);
                refTime = today;
            }

            console.log(" Refreshing Time Slots: " + $scope.timeSlot.length + " Ref Time:  " + refTime);

            $scope.getTimeSlots(refTime);

            console.log(" Slots Size: " + $scope.timeSlot.length);
            if (!scope.initialization) {
                $scope.appointmentDate = $scope.appointmentTime = null;
            } else {
                scope.initialization = false;
            }

            vm.errorDate = false;
        } else {
            $scope.appointmentDate = $scope.appointmentTime = $scope.timeSlot = null;
            //vm.errorDate = true;
        }
        $scope.selectedSlot = null;

    }, true);


}
