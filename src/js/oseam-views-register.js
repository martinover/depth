// -------------------------------------------------------------------------------------------------
// OpenSeaMap Water Depth - Web frontend for depth data handling.
//
// Written in 2012 by Dominik Fässler dfa@bezono.org
//
// To the extent possible under law, the author(s) have dedicated all copyright
// and related and neighboring rights to this software to the public domain
// worldwide. This software is distributed without any warranty.
//
// You should have received a copy of the CC0 Public Domain Dedication along
// with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
// -------------------------------------------------------------------------------------------------

OSeaM.views.Register = OSeaM.View.extend({
    isValid: true,
    events: {
        'click .btn-link' : 'renewCaptcha',
        'submit form'     : 'onFormSubmit'
    },
    initialize: function() {
        this.model.bind('createSuccess', this.onCreateSuccess, this);
        this.model.bind('createFailure', this.onCreateFailure, this);
    },
    render: function() {
        var template = OSeaM.loadTemplate('register');
        this.renderParams =  {
            captchaUrl  : this.model.getCaptchaUrl(),
            idUsername  : OSeaM.id(),
            idPassword1 : OSeaM.id(),
            idPassword2 : OSeaM.id(),
            idCaptcha   : OSeaM.id(),
//            idLicense   : OSeaM.id(),
            idSubmit    : OSeaM.id()
        };
        var content = $(template(this.renderParams));
        OSeaM.frontend.translate(content);
        this.$el.html(content);
        this.fieldUsername  = this.$el.find('#' + this.renderParams.idUsername);
        this.fieldPassword1 = this.$el.find('#' + this.renderParams.idPassword1);
        this.fieldPassword2 = this.$el.find('#' + this.renderParams.idPassword2);
        this.fieldCaptcha   = this.$el.find('#' + this.renderParams.idCaptcha);
//        this.fieldLicense   = this.$el.find('#' + this.renderParams.idLicense);
        this.buttonSubmit   = this.$el.find('#' + this.renderParams.idSubmit);
        var fn = function(data) {
            this.replaceCaptcha(data);
        };
        jQuery.ajax({
            type: 'POST',
            url: OSeaM.apiUrl + 'users/captcha',
            contentType: "application/json",
            dataType: 'json',
//            xhrFields: {
//                withCredentials: true
//            },
            success: jQuery.proxy(fn, this)
        });
        return this;
    },
    replaceCaptcha: function(data) {
    	this.$el.find('#captcha').removeClass('loading').append('<img id="captcha" src="data:image/png;base64,' + data.imageBase64 + '"/>')
    },    
    validateForm: function() {
        this.removeAlerts();
        var errors = [];
        if (OSeaM.utils.Validation.username(this.fieldUsername.val()) !== true) {
            this.markInvalid(this.fieldUsername, '1010:Invalid Email format.');
            //what is this for?
			errors.push('1004:Email');
        }
        if (this.fieldPassword1.val() !== this.fieldPassword2.val()) {
            this.markInvalid(this.fieldPassword2, '1011:Verification is different.');
            errors.push('1017:Password verification');
        }
        if (this.fieldPassword1.val().length < 8) {
            this.markInvalid(this.fieldPassword1, '1012:At least 8 characters.');
            errors.push('1005:Password');
        }
        if (this.fieldPassword2.val().length < 8) {
            this.markInvalid(this.fieldPassword2, '1012:At least 8 characters.');
            errors.push('1017:Password verification');
        }
        if (this.fieldCaptcha.val().length !== 6) {
            this.markInvalid(this.fieldCaptcha, '1013:Invalid captcha.');
            errors.push('1007:Captcha');
        }
//        if (this.fieldLicense.is(':checked') !== true) {
//            this.markInvalid(this.fieldLicense, '');
//            errors.push('1014:License');
//        }
        if (this.isValid !== true) {
            var template = OSeaM.loadTemplate('alert');
            var content  = $(template({
                title:'1027:Validation error occured',
                errors:errors
            }));
            OSeaM.frontend.translate(content);
            this.$el.find('legend').after(content);
        }
        return this.isValid;
    },
    markInvalid: function(field, text) {
        field.parents('.control-group').addClass('error');
        field.next('.help-inline').attr('data-trt', text);
        OSeaM.frontend.translate(this.$el);
        this.isValid = false;
    },
    removeAlerts: function() {
        this.$el.find('.alert').remove();
        this.$el.find('.control-group').removeClass('error');
        this.$el.find('.help-inline').removeAttr('data-trt');
        this.$el.find('.help-inline').html('');
        this.isValid = true;
    },
    onFormSubmit: function(evt) {
        evt.preventDefault();
        this.buttonSubmit.button('loading');
        if (this.validateForm() !== true) {
            this.buttonSubmit.button('reset');
            return;
        }
        var params = {
            username : this.fieldUsername.val(),
            password : this.fieldPassword1.val(),
            captcha  : this.fieldCaptcha.val()
        };
        params.password = jQuery.encoding.digests.hexSha1Str(params.password).toLowerCase();
        // TODO : license accept
        this.model.create(params);
        return false;
    },
    onCreateSuccess: function(data) {
        var template = OSeaM.loadTemplate('alert-success');
        var content = $(template({
            title:'1028:Account created!',
            msg:'1029:Your account has been created successfully.'
        }));
        OSeaM.frontend.translate(content);
        this.$el.find('form').remove();
        this.$el.find('legend').after(content);
    },
    onCreateFailure: function(jqXHR) {
        var template = OSeaM.loadTemplate('alert');
        var msg = '';
        if (jqXHR.status === 409) {
            var response = jQuery.parseJSON(jqXHR.responseText);
            msg = (9000 + response.code).toString() + ':';
            if (response.code === 103) {
                this.markInvalid(this.fieldUsername, '9103:Username already exists.');
                this.fieldUsername.focus();
            }
            if (response.code === 801) {
                this.markInvalid(this.fieldCaptcha, '1013:Invalid captcha.');
                this.renewCaptcha();
                this.fieldCaptcha.val('').focus();
            }
        } else {
            msg = '1031:Unknown error. Please try again.'
        }
        var content = $(template({
            title:'1030:Server error occured',
            msg:msg
        }));
        OSeaM.frontend.translate(content);
        this.$el.find('legend').after(content);
        this.buttonSubmit.button('reset');
    },
    renewCaptcha: function(evt) {
        this.$el.find('img').attr('src', this.model.getCaptchaUrl())
    }
});
