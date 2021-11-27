describe('Login Page', function() {

    it('should fail login', function() {
        browser.get('http://www.ratingsdev.com:8085/#/logout');

        element(by.id('email_login')).sendKeys('InvalidUser');
        element(by.id('pass_login')).sendKeys('InvalidPassword');
        element(by.id('log-in-btn')).click();
        element(by.css('button.confirm')).click();

    });

    it('parent should be successful in login', function() {
        browser.get('http://www.ratingsdev.com:8085/#/logout');

        element(by.id('email_login')).sendKeys('parent@ratingsville.com');
        element(by.id('pass_login')).sendKeys('Password1234*');
        element(by.id('log-in-btn')).click();
        expect(element(by.css('h3.no-margin-top')).getText()).to.eventually.equal("Cell Number Verification Pending");
        expect(element(by.css('li a.link-profile')).getText()).to.eventually.equal("  PARENT");

        //browser.actions().mouseMove(element(by.css('li a.link-profile'))).perform();
        element(by.css('li a.link-profile')).click();
        expect(element(by.css('h3.line-bottom-5')).getText()).to.eventually.equal("Personal Information");

        element(by.css('ul li a[href="#/logout"]')).click();
        expect(element(by.id('pass_login')).isDisplayed()).to.eventually.be.equal(true);

    });



});