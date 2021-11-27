angular.module('routerApp').factory('AutoLogoutService', 
    function(AuthService,$state, $rootScope) {
        var status = 'STOPPED';
        var active = ['load', 'mousemove', 'mousedown', 'click', 'scroll', 'keypress'];
        var idleTimer = 30;  // in minutes
        var timer = 10000;   // in milliseconds - dev only
        var warnTimer = setTimeout(warn, (idleTimer-1)*60*1000);
        var logoutTimer = setTimeout(logout,  idleTimer*60*1000);
        var warnVisible = false;


        //var warnTimer = setTimeout(warn, timer);
        //var logoutTimer = setTimeout(logout, timer + 5000);

        var resetTimer = function() {
            if(!warnVisible) {
                //console.log("resetTimer");
                clearTimer();
                setTimer();
                if (status == "STOPPED") {
                    status = "STARTED";
                }
            }
        };

        var clearTimer = function() {
            if (warnTimer)
                clearTimeout(warnTimer);

            if (logoutTimer)
                clearTimeout(logoutTimer);
        };

        var setTimer = function() {
            //console.log("setTimer")
            warnTimer = setTimeout(warn, (idleTimer-1)*60*1000);
            logoutTimer = setTimeout(logout, idleTimer*60*1000);

            // comment out for dev testing
            // warnTimer = setTimeout(warn, timer);
            // logoutTimer = setTimeout(logout, timer + 10000);

            if( status == "STOPPED"){
                status = "STARTED";
            }
        };

        var warn = function() {
            var secInterval, findInterval;

            console.log('AlertLoggingOutUser');
            warnVisible = true;


            swal({
                title: "Auto Logout",
                html: true,
                text: 'You have been inactive for 30 minutes. You will be logged out after <span id="warn-minute">60</span> seconds. To stay logged in, click the box below.',
                type: 'warning',
                confirmButtonText: "I'm still here"
                //timer: timer
            },function(confirm){
                if(confirm){
                    swal.close();
                    resetTimer();
                    warnVisible = false;

                    if (findInterval)
                        clearInterval(findInterval);

                    if (secInterval)
                        clearInterval(secInterval);
                }
            });

            // counts down seconds text in sweetalert
            var start = 60;
            var secondsText;
            findInterval = setInterval(function() {
                if(warnVisible) {
                    if ((secondsText = $('#warn-minute')).length) {
                        clearInterval(findInterval);
                        secInterval = setInterval(function () {
                            if(warnVisible) {
                                secondsText.text(--start);

                                if (start < 0) {
                                    return 0;
                                }

                                console.log("Counting before logout: " + start);
                                if (start == 0) {
                                    console.log("Inactive");
                                    logout(); // Force logout even if resetTimer() is called after 30mins of idle.
                                    return;
                                }
                            } else {
                                start = 0;
                            }
                        }, 1000);
                    }
                } else {
                    start = 0;
                }
            }, 100);
        };

        var logout = function() {
            // Send a logout request to the API
            console.log('LoggingOutUser');
            swal.close();
            destroyTimer(); // Cleanup
            warnVisible = false;

            AuthService.logout();
            $rootScope.$broadcast('user-logged-out');
            localStorage.removeItem('userId');
            $state.go('home');
        };

        var destroyTimer = function() {
            clearTimer();

            for (var i in active) {
                window.removeEventListener(active[i], resetTimer);
            }

            if( status == "STARTED"){
                status = "STOPPED";
            }
        };

        var start = function (){
            console.log("AutoLogoutService.started");
            for (var i in active) {
                window.addEventListener(active[i], resetTimer);
            }
            clearTimer();
            setTimer();
        };

        var stop = function(){
            console.log("AutoLogoutService.stopped");
            destroyTimer();

        };

        var getStatus = function(){
            console.log("AutoLogoutServiceStatus: "+status);
            return status;
            //destroyTimer();
        };

        var isStarted = function(){
            return status == "STARTED";
            //destroyTimer();
        };
        

        
        return {start:start,
                stop : stop,
                setTimer: setTimer,
                resetTimer: resetTimer,
                getStatus:getStatus,
                isStarted:isStarted
                };

    }

);