(function() {
    'use strict';

    angular
        .module('routerApp')
        .value('storageKey', 'rv_user_da')
        .factory('storage', provideStorage);

    provideStorage.$inject = ['$exceptionHandler', '$window', 'storageKey'];

    function provideStorage($exceptionHandler, $window, storageKey) {
        // Note: this code is not mine but taken from one of the blog posts
        // of the awesome Ben Nadel
        // http://www.bennadel.com/blog/2861-encapsulating-localstorage-access-in-angularjs.htm

        //try to load the initial payload from localStorage
        var items = loadData();

        // maintain the collection of callbacks that want to hook into the
        // unload event of the in-memory cache. This will give the caling context
        // a chance to update their relevant storage items before the data
        // is persisted to localStorage
        var persistHooks = [];

        // determine if the cache data should be persisted to localStorage when
        // the application is unloaded
        var persistEnabled = true;

        // During the application lifetime, we're going to be using in-memory
        // data access (since localStorage I/O is relatively expensive and requires)
        // data to be serialized - two things we don't want the user to feel).
        // However, when the application unloads, we want to try to persist
        // the in-memory cache to localStorage
        $window.addEventListener("beforeunload", persistData);

        //return the public API
        return ({
            clear: clear,
            disablePersist: disablePersist,
            enablePersist: enablePersist,
            extractItem: extractItem,
            getItem: getItem,
            onBeforePersist: onBeforePersist,
            removeItem: removeItem,
            setItem: setItem
        });

        // public methods below

        //clear the current data cache
        function clear() {
            local_data = {};
        }

        // disable the persisting of the cache to localStorage on unload
        function disablePersist() {
            persistEnabled = false;
        }

        // enable persisting of the cache to localStorage on unload
        function enablePersist() {
            persistEnabled = true;
        }

        // remove the given key from the cache and return the value that was
        // cache with the key; returns null if the key didn't exist
        function extractItem(key) {
            var value = getItem(key);
            removeItem(key);
            return (value);
        }

        // return the item at the given key; returns null if not available
        function getItem(key) {
            key = normalizeKey(key);
            // we are using .copy() so that the internal cache can't be mutated through direct object reference
            return ((key in items) ? angular.copy(items[key]) : null);
        }

        // add the given operator to persist hooks that will be invoked prior
        // to unload-based performance
        function onBeforePersist(operator) {
            persistHooks.push(operator);
        }

        // remove the given key from the cache
        function removeItem(key) {
            key = normalizeKey(key);
            delete(items[key]);
        }

        //store the item at the given key
        function setItem(key, value) {
            key = normalizeKey(key);
            //use .copy() again
            items[key] = angular.copy(value);
        }

        //private methods below

        // attemp to load the cache fromt the localStorage interface. Once the
        // data is loaded, it is deleted from localStorage
        function loadData() {
            // there's a chance that the localStorage isn't available, even in
            // modern browsers (safari, running in private mode)
            try {
                if (storageKey in $window.localStorage) {
                    var data = $window.localStorage.getItem(storageKey);
                    //remove item from localStorage
                    $window.localStorage.removeItem(storageKey);
                    // using .extend() here as a safe-guard to ensure that the
                    // value we return is actually a hash, even if the data is
                    // corrupted
                    return (angular.extend({}, angular.fromJson(data)));
                }
            } catch (localStorageError) {
                $exceptionHandler(localStorageError);
            }

            //if code reached here, something went wrong
            return ({});
        }

        // normalize the given cache key so that we never collide with any
        // native object keys when looking up items
        function normalizeKey(key) {
            return ("storage_" + key);
        }

        // attempt to persist the cache to the localStorage
        function persistData() {
            // console.log('data is unloaded');
            // before we persist the data, invoke all the of the before-persist
            // hook operators so that consuming services have one last chance
            // to synchronize their local data with the storage data
            for (var i = 0, length = persistHooks.length; i < length; i++) {
                try {
                    persistHooks[i]();
                } catch (persistHookError) {
                    $exceptionHandler(persistHookError);
                }
            }
            // if persistence is disabled, skip the localStorage access
            if (!persistEnabled) {
                return;
            }

            // there's a chance that localStorage isn't available, even in modern
            // browsers. And, even if it does exist, we may be attempting to store
            // more data that we can based on per-domain quotas.
            try {
                $window.localStorage.setItem(storageKey, angular.toJson(items));
            } catch (localStorageError) {
                $exceptionHandler(localStorageError);
            }
        }

    }

})();