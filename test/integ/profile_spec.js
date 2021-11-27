describe('Profile Page', function() {

    it('should go to dashboard and parent links available', function() {
        browser.get('http://www.ratingsdev.com:8085/#/logout');

        element(by.id('email_login')).sendKeys('parent@ratingsville.com');
        element(by.id('pass_login')).sendKeys('Password1234*');
        element(by.id('log-in-btn')).click();
        expect(element(by.css('h3.no-margin-top')).getText()).to.eventually.equal("Cell Number Verification Pending");
        expect(element(by.css('li a.link-profile')).getText()).to.eventually.equal("  PARENT");

        browser.actions().mouseMove(element(by.css('li a.link-profile'))).perform();
        element(by.css('li a.link-profile')).click();
        expect(element(by.css('h3.line-bottom-5')).getText()).to.eventually.equal("Personal Information");

        element(by.css('div.list-group  a[href="#/dashboard"]')).click();

        element(by.css('div.list-group  a[href="#/dashboard/change-password"]')).click();
        expect(element(by.css('h3.line-bottom-5')).getText()).to.eventually.equal("Security Information");

        element(by.css('div.list-group  a[href="#/dashboard/reviews"]')).click();
        expect(element(by.css('div.sidemenu-show h3')).getText()).to.eventually.equal("Reviews");

        element(by.css('div.list-group  a[href="#/dashboard/favorites"]')).click();
        expect(element(by.css('div.sidemenu-show h3')).getText()).to.eventually.equal("My Favorite Daycares ( 0 )");

    });

    it('should go to dashboard profile information', function() {

        element(by.css('div.list-group  a[href="#/dashboard/profile"]')).click();
        expect(element.all(by.css('h3.line-bottom-5')).get(0).getText()).to.eventually.equal("Personal Information");
        expect(element.all(by.css('div.info div span')).get(0).getText()).to.eventually.equal("Not provided");
        expect(element.all(by.css('div.info div span')).get(1).getText()).to.eventually.equal("Parent");
        expect(element.all(by.css('div.info div span')).get(2).getText()).to.eventually.equal("Not provided");
        expect(element.all(by.css('div.info div span')).get(3).getText()).to.eventually.equal("User");
        expect(element.all(by.css('div.info div span')).get(4).getText()).to.eventually.equal("Not provided");
        expect(element.all(by.css('div.info div span')).get(5).getText()).to.eventually.equal("Not provided");
        expect(element.all(by.css('h3.line-bottom-5')).get(1).getText()).to.eventually.equal("Contact Information");
        expect(element.all(by.css('div.info div span')).get(6).getText()).to.eventually.equal("parent@ratingsville.com");
        expect(element.all(by.css('div.info div span')).get(7).getText()).to.eventually.equal("8482197734");
        expect(element.all(by.css('div.info div span')).get(8).getText()).to.eventually.equal("Not provided");
        expect(element.all(by.css('div.info div span')).get(9).getText()).to.eventually.equal("Not provided");
        expect(element.all(by.css('div.info div span')).get(10).getText()).to.eventually.equal("Email");
        // expect(element.all(by.css('div.info div span')).get(11).getText()).to.eventually.equal("Not provided");
        // expect(element.all(by.css('div.info div span')).get(12).getText()).to.eventually.equal("Not provided");
    });

    it('should go to dashboard security information', function() {

        element(by.css('div.list-group  a[href="#/dashboard/security"]')).click();
        expect(element(by.css('h3.line-bottom-5')).getText()).to.eventually.equal("Security Questions");

    });


});