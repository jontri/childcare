(function (angular) {
    'use strict';

    var rvDate = function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                rvDate: '=',
                rvDateMin: '=?',
                rvDateMax: '=?',
                rvDateCompare: '=?',
                rvDateCb: '&?'
            },
            link: function (scope, element, attributes, modelCtrl) {
                if (!attributes.placeholder)
                    element.attr('placeholder', 'mm/dd/yyyy');

                var regex = /[0-9\/]/g,
                    isDateFormat = true,
                    isDateMore = true,
                    isDateLess = true;

                var defaultOpts = {
                    compare: 1 // greater than
                };

                if (scope.rvDate) {
                    angular.extend(defaultOpts, scope.rvDate);
                }

                modelCtrl.$$setOptions({
                    updateOnDefault: true,
                    allowInvalid: true
                });

                modelCtrl.$validators.dateRequired = function (modelValue) {
                    if (modelCtrl.$viewValue === '' && attributes.required)
                        return false;
                    return true;
                };

                modelCtrl.$validators.rvDate = function (modelValue) {

                    if ((!modelValue && (!modelCtrl.$viewValue || modelCtrl.$viewValue === ''))) {
                        return true;
                    }
                    
                    //console.log("Validating " + modelValue + "  -  "  + modelCtrl.$viewValue);
                    var momentDate = moment(modelCtrl.$viewValue, "MM/DD/YYYY", true);

                    //console.log("Date is Valid: " + modelCtrl.$viewValue + " --- " + momentDate.isValid());

                    if(!(momentDate.isValid())) {
                        console.log("Moment Valid date false" )
                        if(isDateFormat){
                            console.log("Moment Valid date true" )
                            return false;
                        } else {
                            console.log("Moment Valid date false" )
                            return true;
                        }
                    } 

                    var date = new Date(modelValue);

                    if ((date instanceof Date) && (date.toDateString() != 'Invalid Date')) {
                        if (scope.rvDateCb) {
                            scope.rvDateCb({date: date});
                        }
                        return true;
                    }

                    if(isDateFormat){
                        console.log("Valid date false" );
                        return false;
                    } else {
                        console.log("Valid date true" );
                        return true;
                    }
                };

                modelCtrl.$validators.rvDateAllowedMin = function (modelValue) {
                    var momentDate = moment(modelCtrl.$viewValue, "MM/DD/YYYY", true);
                    var minimumAllowedDate = moment("01/01/1900", "MM/DD/YYYY", true);
                    if(momentDate.isBefore(minimumAllowedDate)) {
                        console.log("Moment date before 01/01/1900 true" )
                        return false;
                    }

                    return true;
                };

                modelCtrl.$validators.rvDateFormat = function (modelValue) {
                    return isDateFormat;
                };

                modelCtrl.$validators.rvDateMin = function (modelValue) {
                    if (!modelValue || !scope.rvDateMin) {
                        return true;
                    }

                    var date = new Date(modelValue);
                    if ((date instanceof Date) && (date.toDateString() != 'Invalid Date')) {
                        var ageDifDate = new Date(Date.now() - date.getTime());
                        var age = ageDifDate.getUTCFullYear() - 1970;
                        if (age >= scope.rvDateMin) {
                            return true;
                        }
                    }

                    return false;
                };

                modelCtrl.$validators.rvDateMax = function (modelValue) {
                    if (!modelValue) {
                        return true;
                    }

                    var date = new Date(modelValue);

                    if ((date instanceof Date) && (date.toDateString() != 'Invalid Date')) {
                        var msDay = 86400000; // milliseconds in a day
                        var dateNow = new Date(new Date(scope.rvDateMax || '').toDateString()); // gets today's date with no time ex: Sun Jul 02 2017 00:00:00
                        var dateTmrwMs = dateNow.getTime() + msDay; // tomorrow's date in milliseconds
                        scope.rvDateMax = dateCustom(new Date(dateTmrwMs));
                        if (date.getTime() < dateTmrwMs) {
                            return true;
                        }
                    }

                    return true;
                };

                modelCtrl.$validators.rvDateMore = function (modelValue) {
                    return isDateMore;
                };
                modelCtrl.$validators.rvDateLess = function (modelValue) {
                    return isDateLess;
                };

                modelCtrl.$parsers.push(parseDate);
                modelCtrl.$formatters.push(dateFormatter);

                function parseDate(val) {
                    isDateFormat = isDateMore = isDateLess = true;
                    if (val) {
                        var date = dateValidation(val);
                        if (date) {
                            compareDate(date);
                            return moment.utc([date.getFullYear(),date.getMonth(),date.getDate()]).toISOString();
                        }
                    }
                    return '';
                }

                function dateValidation(val) {
                    // checks for 'mm/dd/yyyy' format


                    isDateFormat = /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(val) || val === '';
                    console.log("Checking Date Format : " + val + " " + isDateFormat);
                    var date = new Date(val);
                    if (date.toDateString() != 'Invalid Date' && isDateFormat) {
                        return date;
                    }
                    return undefined;
                }

                function dateFormatter(val) {
                    if (val) {
                        var date = new Date(val);

                        if (typeof val == 'string') {
                            modelCtrl.$modelValue = date;
                        }
                        if (date.toDateString() != 'Invalid Date') {
                            if (scope.rvDateCb) {
                                scope.rvDateCb({date: date});
                            }
                            return dateCustom(date);
                        }
                    }
                    return '';
                }

                // converts the date object into 'mm/dd/yyyy' format
                function dateCustom(date) {
                    if (!date || !(date instanceof Date) || (date.toDateString() == 'Invalid Date')) {
                        return '';
                    }

                    var momentDate = moment(date).utcOffset(0);

                    // console.log("Return Date:  " + returnDate);
                    return momentDate.format('MM/DD/YYYY');
                }

                function compareDate(date) {
                    if (scope.rvDateCompare && (scope.rvDateCompare instanceof Date) && (scope.rvDateCompare.toDateString() != 'Invalid Date')) {
                        var dateMs = date.getTime();
                        var dateCompareMs = scope.rvDateCompare.getTime();

                        isDateMore = (defaultOpts.compare ? (dateMs > dateCompareMs) : true);
                        isDateLess = (defaultOpts.compare ? true : (dateMs < dateCompareMs));
                    }
                }

                scope.$watch('rvDateCompare', function (newval, oldval) {
                    if (newval && (newval !== oldval) && modelCtrl.$modelValue) {
                        compareDate(modelCtrl.$modelValue);
                        modelCtrl.$validate();
                    } else {
                        isDateMore = isDateLess = true;
                        modelCtrl.$validate();
                    }
                });

                scope.$watch(function () {
                    return modelCtrl.$viewValue;
                }, function (newval, oldval) {
                    if (typeof newval != 'undefined' && typeof oldval != 'undefined' && newval != oldval && newval.length > oldval.length) {
                        var update;

                        var res = newval.match(regex);
                        if (!res || res.length != newval.length) {
                            newval = (res ? res.join('') : '');
                            update = true;
                        }
                    }
                });

                element.on('keydown', function (e) {
                    // stop user from adding '/', directive already adds 2 '/'


                    // console.log("Key pressed -->  " + e.which);

                    if (e.which == 191) {
                        e.preventDefault();
                    }


                    if ((e.keyCode != 8 && e.keyCode != 13 && e.keyCode != 9 && e.keyCode != 16) && (!(e.keyCode > 36 && e.keyCode < 41)) && (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57))) {
                        e.preventDefault();
                    }

                });

                element.on('keyup', function (e) {

                    var newval = element.val();

                    if (newval.length > 10) {
                        element.val(newval.slice(0, 10));

                    } else if (newval && e.keyCode != 8 ) { // ignore backspace key

                        // ignore "/" keys
                        if (e.which == 191) {
                            e.preventDefault();
                        }

                        var formattedVal = "";
                        newval = newval.replace(/\//g, "");

                        if(newval.length > 4){
                            formattedVal = newval.substring(0,2) + "/" + newval.substring(2,4) + "/" + newval.substring(4,newval.length );
                        } else if(newval.length > 2){
                            formattedVal = newval.substring(0,2) + "/" + newval.substring(2,newval.length );
                        } else {
                            formattedVal = newval;
                        }

                        modelCtrl.$setViewValue(formattedVal);
                        modelCtrl.$render();
                    } else {

                    }
                });
            }
        };
    };

    angular
        .module('routerApp')
        .directive("rvDate", [rvDate]);

})(angular);