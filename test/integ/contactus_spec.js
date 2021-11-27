describe('Contact Us Page', function() {

    it('should display contact us page', function() {
        browser.get('http://www.ratingsdev.com:8085/#/logout');

        element(by.id('email_login')).sendKeys('parent@ratingsville.com');
        element(by.id('pass_login')).sendKeys('Password1234*');
        element(by.id('log-in-btn')).click();
        expect(element(by.css('h3.no-margin-top')).getText()).to.eventually.equal("Cell Number Verification Pending");
        expect(element(by.css('li a.link-profile')).getText()).to.eventually.equal("  PARENT");

        element.all(by.css('ul.main-nav-top li')).get(6).click();
        expect(element(by.css('h1.color-white div')).getText()).to.eventually.equal("Contact Us");

    });

    it('should throw email required error', function() {
        element(by.name('subject')).sendKeys('Sample Contact Us Subject');
        element(by.name('message')).sendKeys('Sample Contact Us Message');
        element.all(by.css('button.btn-t-primary')).get(1).click();
        expect(element(by.css('div.text-danger div')).getText()).to.eventually.equal("This is a required field.");

    });

    it('should throw email validation error', function() {
        element(by.name('subject')).sendKeys('Sample Contact Us Subject');
        element(by.name('message')).sendKeys('Sample Contact Us Message');
        element(by.name('sender_email')).sendKeys('admin');
        element.all(by.css('button.btn-t-primary')).get(1).click();
        expect(element(by.css('div.text-danger div')).getText()).to.eventually.equal("Please provide a valid email address.");

    });

    it('should throw message required error', function() {
        element(by.name('subject')).sendKeys('Sample Contact Us Subject');
        element(by.name('message')).clear();
        element(by.name('sender_email')).clear();
        element.all(by.css('button.btn-t-primary')).get(1).click();
        expect(element.all(by.css('div.text-danger div')).get(0).getText()).to.eventually.equal("This is a required field.");
        expect(element.all(by.css('div.text-danger div')).get(1).getText()).to.eventually.equal("This is a required field.");

    });

    it('should submit contact us succesfully', function() {
        element(by.name('subject')).sendKeys('Sample Contact Us Subject');
        element(by.name('message')).sendKeys('Sample Contact Us Message');
        element(by.name('sender_email')).sendKeys('admin@ratingsville.com');
        element.all(by.css('button.btn-t-primary')).get(1).click();
        expect(element(by.css('div.alert')).getText()).to.eventually.equal("Message successfully sent.");

    });



});