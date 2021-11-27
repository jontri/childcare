describe('Search Page', function () {

    it('should go to search page', function () {
        browser.get('http://www.ratingsdev.com:8085/#/logout');

        element(by.id('email_login')).sendKeys('parent@ratingsville.com');
        element(by.id('pass_login')).sendKeys('Password1234*');
        element(by.id('log-in-btn')).click();
        expect(element(by.css('h3.no-margin-top')).getText()).to.eventually.equal("Cell Number Verification Pending");
        expect(element(by.css('li a.link-profile')).getText()).to.eventually.equal("  PARENT");

        element(by.id('searchLink')).click();
        expect(element(by.css('h3.color-white')).getText()).to.eventually.equal("Find Your Daycare");

        element(by.id('txtDayCare')).sendKeys("Kids");
        element(by.id('search_button_basic')).click();
        expect(element(by.css('span.border-error-text')).getText()).to.eventually.equal("City/State, Zip Code or County is required.");


        element(by.id('txtZip')).sendKeys("32828");
        element(by.id('search_button_basic')).click();

        expect(element.all(by.css('div.item h3.no-margin-top a.ng-binding')).get(0).getText()).to.eventually.equal("A+ Kids Learning Academy");

        element(by.id('txtCounty')).sendKeys("Orange");
        element(by.id('txtZip')).clear();

        element(by.id('search_button_basic')).click();

        expect(element.all(by.css('div.item h3.no-margin-top a.ng-binding')).get(0).getText()).to.eventually.equal("1st Pavilion Kids Academy, Inc");

        element.all(by.css('div.divPagination div.col-sm-9 button.btn-secondary')).get(2).click();


        expect(element.all(by.css('div.item h3.no-margin-top a.ng-binding')).get(0).getText()).to.eventually.equal("Creative Kids Connection");

        browser.actions().mouseMove(element(by.id('btnSearchGroupBasic'))).perform();
        element(by.id('btnSearchGroupBasic')).click();
        browser.actions().mouseMove(element(by.id('btnGotoAdvanceSearch'))).perform();
        element(by.id('btnGotoAdvanceSearch')).click();

        expect(element(by.id('divAdvancedSearch')).all(by.css('div.col-sm-3 div.form-group label.color-white')).get(0).getText()).to.eventually.equal("Daycare Name");


        element(by.id('txtAddress')).sendKeys("1825 Anna Catherine Drive, Orlando, FL");
        element(by.id('search_button_main')).click();
        expect(element.all(by.css('div.item h3.no-margin-top a.ng-binding')).get(0).getText()).to.eventually.equal("Molina Family Day Care Home");


        browser.driver.sleep(3000);
    });

});