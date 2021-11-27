var slowThreshold = 5000;
var allScriptsTimeout = 20000;
var defaultPageLoadTimeout = 2000;
var mochaTimeout = 50000;
var capabilities  = {
        browserName: 'chrome',
        chromeOptions: {
            args: [
                '--start-maximized'
            ]
        }
    }

exports.config = {
    // seleniumAddress: 'http://localhost:4444/wd/hub',
    allScriptsTimeout: allScriptsTimeout,
    capabilities: capabilities,
    framework: 'mocha',
    mochaOpts: {
        reporter: 'spec',
        slow: slowThreshold,
        timeout: mochaTimeout
    },
    specs: [
        'integ/contactus_spec.js',
        'integ/login_spec.js',
        'integ/profile_spec.js',
        'integ/search_spec.js'
        ],
    directConnect: true,
    onPrepare: function(){

        var chai = require('chai');
        var chaiAsPromised = require('chai-as-promised');
        chai.use(chaiAsPromised);
        global.expect = chai.expect;

        setTimeout(function() {
            browser.driver.executeScript(function() {
                return {
                    width: window.screen.availWidth,
                    height: window.screen.availHeight
                };
            }).then(function(result) {
                browser.driver.manage().window().setSize(result.width, result.height);
            });
        });
    },
};