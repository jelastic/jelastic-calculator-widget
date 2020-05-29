var JApp = window.JApp || {};
$ = $ || jQuery;

window.JApp = (function (that) {
    var sDefaultHoster = "eapps",
        sLang = "en",
        sLoadedDefHoster = '',
        PATH_TO_JS = '/wp-content/themes/salient/js/';

    that.COOKIE_EXTERNAL_REFERER = "je-external-referer";
    that.COOKIE_FIRST_EXTERNAL_REFERER = "je-first-external-referer";
    that.COOKIE_UTM_LABELS = "je-utm-labels";
    that.RECAPCHA_KEY = "6LcR2y0UAAAAALs_-g-iuco7GoI2GTFd7rTl_pNe";
    that.userIP;
    that.userCountry;

    that.getLang = function () {
        return sLang;
    };

    that.getDefaultHoster = function () {
        return sLoadedDefHoster || sDefaultHoster;
    };

    that.isLoadedDefHoster = function () {
        return sLoadedDefHoster.length !== 0;
    };

    that.url = {

        getPlatformsInfoHost: function () {
            return "//platforms-info.jelastic.com";
        },

        getSignupURL: function () {
            return that.url.getPlatformsInfoHost() + "/api/site/signup";
        },

        getUserDefHosterURL: function () {
            return that.url.getPlatformsInfoHost() + "/api/user/getdefhoster";
        },

        getUserCountryURL: function () {
            return that.url.getPlatformsInfoHost() + "/api/user/getcountry";
        },

        getAppsURL: function () {
            return "//marketplace.jelastic.com/GetApps?search=%7B%22appstore%22:%221%22%7D";
        },

        getInstallAppURL: function () {
            return '//go.jelastic.com/InstallApp';
        },

        getHosters: function () {
            return "//platforms-info.jelastic.com/api/site/GetHosters";
        },

        getCrossApi: function () {
            return that.url.getPlatformsInfoHost() + "/1.0/development/scripting/cross/eval";
        }

    };

    that.loadApps = function (fnCallback) {
        $.ajax({
            type: "GET",
            url: JApp.url.getAppsURL(),
            success: function (response) {
                var oResp = jQuery.parseJSON(response) || {};

                if (oResp.result === 0 && oResp.response) {
                    oResp = oResp.response;
                }

                if (fnCallback) {
                    fnCallback(oResp);
                }

            }
        });
    };

    that.loadHosters = function (fnCallback) {
        $.ajax({
            type: "GET",
            url: JApp.url.getHosters(),
            async: true,
            success: function (response) {
                var oResp = '';
                if (response.result === 0 && response.hosters) {
                    oResp = response.hosters;
                }

                if (fnCallback) {
                    fnCallback(oResp);
                }
            }
        });
    };

    that.loadDefaultHoster = function (fnCallback, oCriteria) {

        oCriteria = oCriteria || {};

        $.ajax({
            type: "POST",
            url: JApp.url.getUserDefHosterURL(),
            data: {
                criteria: JSON.stringify(oCriteria)
            },
            success: function (response) {
                var oResp = jQuery.parseJSON(response) || {};

                if (oResp.result === 0 && oResp.response) {
                    oResp = oResp.response;
                }

                sLoadedDefHoster = oResp.hoster;

                if (fnCallback) {
                    fnCallback();
                }

            },

            error: function (jqXHR, textStatus, errorThrown) {
                sLoadedDefHoster = sDefaultHoster;
                if (fnCallback) {
                    fnCallback();
                }
            }
        });
    };

    that.loadDefHosterByCookie = function (fnCallback, sAvailableHosters) {

        var fnOnResp,
            nTimeout,
            availableHosters;

        availableHosters = [];
        $.each(window.hosters, function (i, oHoster) {
            availableHosters[i] = oHoster.keyword;
        });
        availableHosters = availableHosters.join();

        fnOnResp = function (oResponse) {

            clearTimeout(nTimeout);

            if (oResponse && oResponse.result === 0) {
                oResponse = oResponse.response;
            }

            if (oResponse.result === 0) {

                sLoadedDefHoster = oResponse.hoster;
            } else {
                JApp.debug.info("Default hoster did not determined.", oResponse);
            }

            if (fnCallback) {
                fnCallback(sLoadedDefHoster);
            }
        };



        that.utils.CROSSTransport.request(JApp.url.getCrossApi(), {
            script: "api.user.getdefhoster",
            availableHosters: availableHosters,
            forceUserPlatform: true
        }, fnOnResp);

        nTimeout = setTimeout(function () {

            fnOnResp({
                error: "Timeout exceed"
            }, "error");
        }, 5000);
    };

    that.GetUserCountry = function (fnCallback) {
        var sDefault = "N/A";

        $.ajax({
            type: 'POST',
            url: JApp.url.getUserCountryURL(),
            success: function (sResponse) {
                var oResp = jQuery.parseJSON(sResponse);

                if (oResp.result === 0 && oResp.response.result === 0) {
                    fnCallback(oResp.response.country);
                    $.cookie('user_country', oResp.response.country);

                } else {
                    fnCallback(sDefault);
                }
            },
            error: function () {
                fnCallback(sDefault);
            }
        });
    };

    that.GetUserIp = function (fnCallback) {
        var sDefaultIP = '127.0.0.1';

        UserInfo.getInfo(function (data) {
            JApp.userIP = data.ip_address;
            JApp.userCountry = data.country.name;
            $.cookie('user_ip', data.ip_address, { expires: 7, path: '/' });
            $.cookie('user_country', data.country.name, { expires: 7, path: '/' });
            if (fnCallback) {
                fnCallback(data.ip_address);
            }
        }, function (err) {
            fnCallback(sDefaultIP);
        })
    }

    that.InstallApp = function (oParams, fnCallback) {

        var data = {
                email: oParams.email,
                app: oParams.appid,
                key: oParams.hoster,
                manifest: oParams.manifest,
                group: oParams.group,
                source: oParams.source,
                iref: document.location.href,
                eref: document.referrer,
                lang: 'en'
            },
            fnCallbackWrap;

        fnCallbackWrap = function (response, textStatus) {

            var oResp = jQuery.parseJSON(response);
            if (fnCallback) {
                fnCallback(oResp);
            }
        };

        $.ajax({
            type: 'POST',
            data: data,
            url: JApp.url.getInstallAppURL(),
            success: fnCallbackWrap,
            error: fnCallbackWrap
        });

    };

    that.jsPath = function () {
        return PATH_TO_JS;
    };

    return that;
}(window.JApp || {}));


JApp.utils = (function (that) {

    that.toCamelCase = function (str) {
        return str
            .replace(/\s(.)/g, function (s) {
                return s.toUpperCase();
            })
            .replace(/\s/g, '')
            .replace(/^(.)/, function (s) {
                return s.toLowerCase();
            });
    };

    that.isValidEmail = function (email) {
        var pattern = /.@./;
        return pattern.test(email);
    };

    that.isValidEmailStrong = function (email) {
        var pattern = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/i;
        return pattern.test(email);
    };

    that.checkFraudEmail = function (email) {
        var requestIP = '';
        if (JApp.userIP) {
            requestIP = '&userip=' + JApp.userIP;
        }

        var url = '//platforms-info.jelastic.com/api/site/checkfraudemail?email=' + encodeURIComponent(email) + requestIP;

        $.ajax({
            type: "GET",
            url: url,
            success: function (response) {

                if (response.result !== 0) {
                    var maxmindBan = '';
                    var riskScore = '';
                    var risk = '';

                    maxmindBan = response.maxmindBan;

                    if (maxmindBan) {
                        riskScore = response.maxmindResponse.risk_score;
                        risk = response.maxmindResponse.ip_address.risk;
                    }

                    that.SendBadEmailToDB(email, maxmindBan, riskScore, risk);
                }
            },
            error: function (err) {
                console.warn('err: ', err);
            }
        });

    }

    that.SendBadEmailToDB = function (email, maxmindBan, riskScore, risk) {
        $.ajax({
            url: "/wp-admin/admin-ajax.php",
            data: {
                "action": "add_acae_email",
                "email": email,
                "ip": JApp.userIP,
                "country": JApp.userCountry,
                "maxmindban": maxmindBan,
                "riskscore": riskScore,
                "risk": risk
            },
            method: "POST",
            success: function (data) {
                // console.log('response: ', data);
            },
            error: function (err) {
                console.warn('error: ', err);
            }
        });
    }

    that.cutStr = function (sStr, nMAxLng) {

        var STRING_SEP = ". ",
            aString;

        nMAxLng = nMAxLng || 90;
        if (sStr.length > nMAxLng) {
            aString = sStr.substring(0, nMAxLng).split(STRING_SEP);
            if (aString.length > 1) {
                aString.pop();
                sStr = aString.join(STRING_SEP) + ".";
            } else {
                sStr = sStr.substring(0, nMAxLng - 3) + "...";
            }
        }
        return sStr;
    };

    return that;
}(JApp.utils || {}));

JApp.utils.reCaptcha = (function () {

    var oLoadCaptcha = $.Deferred();

    window.onReCaptchaLoad = function () {
        oLoadCaptcha.resolve();
    };

    return function (oParams) {

        var me = this,
            sTarget = oParams.target,
            fnChange = function (sV) {
                sValue = sV;
                if ($.isFunction(me.onChange)) {
                    me.onChange(sValue);
                }
            },
            sValue,
            nId;

        me.getValue = function () {
            return sValue;
        };

        me.onChange = oParams.onChange || null;

        me.reset = function () {
            grecaptcha.reset(nId);
        };

        me.getId = function () {
            return nId;
        };

        oLoadCaptcha.done(function () {
            nId = grecaptcha.render(sTarget, {
                sitekey: JApp.RECAPCHA_KEY,
                size: 'invisible',
                callback: fnChange
            });
        });

        return me;
    };
}());


JApp.utils.Modal = (function (that) {

    that.errors = {
        TOKEN_TO_SHORT: "Token should consist of 40 symbols",
        INVALID_EMAIL: "The e-mail value is not valid",
        INVALID_DATA: "This field is not valid",
        SOME_ERROR_INSTALL: "Some error has occurred",
        REQUIRED_FIELD: "This field is required"
    };

    that.show = function ($el, oOpt) {
        var nTimeoutId,
            sMsg = oOpt.msg,
            sPos = oOpt.position || 'right',
            nTimeOut = oOpt.hideTime || 5000,
            nWidth = oOpt.width || 220,
            fnHide,
            bAutoHide = oOpt.autoHide || true;

        if (sPos === 'auto') {
            sPos = ($(window).width() - $el.offset().left - $el.width() > nWidth) ? 'right' : 'bottom';
        }

        fnHide = function () {
            if (bAutoHide) {
                clearTimeout(nTimeoutId);
            }
            $el.popover('hide');
        };

        // $el.popover('destroy');

        $el.popover($.extend(oOpt, {
            placement: sPos,
            trigger: 'manual',
            animation: true,
            content: sMsg
        })).popover('show');

        if (bAutoHide) {
            nTimeoutId = setTimeout(function () {
                $el.popover('hide');
            }, nTimeOut);
        }

        $el.one("focus keypress change").focus(function () {
            fnHide();
        });
    };

    that.hoverShow = function (oEl, oOpt) {

        oEl.hover(function () {
            that.show(oEl, oOpt);
        }, function () {

            oEl.popover("hide");
        });

    };

    that.Massage = (function () {
        var $cnt = $('#modal-general'),
            $title = $cnt.find('.title'),
            $msg = $cnt.find('.massage');

        return function (oParams) {
            var oOptions = {
                backdrop: oParams.backdrop || true,
                keyboard: oParams.keyboard || true,
                show: oParams.show || true
            };

            $title.html(oParams.title || '');
            $msg.html(oParams.msg || '');

            $cnt.modal(oOptions);
        };
    })();

    return that;
}(JApp.utils.Modal || {}));

JApp.Metrika = (function (that) {

    that.EVENTS = {
        SUBMIT_HOSTERS_REQUEST_INFORMATION: "SUBMIT_HOSTERS_REQUEST_INFORMATION",
        SUBMIT_PRIVATE_CLOUD_FREE_TRIAL: "SUBMIT_PRIVATE_CLOUD_FREE_TRIAL",
        SUBMIT_SPECIAL_HOSTER_LANDING: "SUBMIT_SPECIAL_HOSTER_LANDING",
        SUBMIT_LANDING_VPC: "SUBMIT_LANDING_VPC",
        SUBMIT_VIRTUAL_PRIVATE_CLOUD: "SUBMIT_VIRTUAL_PRIVATE_CLOUD"
    };

    that.getCounter = function () {
        return window.yaCounter28600226;
    };

    that.trackSubmitting = function (sEvent, fnCallback, oParams) {

        var oCounter = that.getCounter();

        if (oCounter) {
            oCounter.reachGoal(sEvent, oParams, fnCallback);
        }
    };

    return that;

}(JApp.Metrika || {}));

JApp.GA = (function (that) {

    var oMetrika = JApp.Metrika;

    that.track = function (oParams) {

        var oOptions = {
            "hitType": "event",
            "eventCategory": oParams.category,
            "eventAction": oParams.action || '',
            "eventLabel": oParams.label || ''
        };

        if (Object.prototype.hasOwnProperty.call(oParams, "value")) {
            oOptions.eventValue = oParams.value;
        }

        if (!!oParams.redirect) {
            oOptions.hitCallback = function () {
                setTimeout(function () {
                    window.location.href = oParams.redirect;
                }, 50);
            };
        }

        JApp.debug.info("Track GA", oOptions);

        if (window.ga) {
            ga("send", oOptions);
        }

        if (oOptions.hitCallback) {
            if (window.ga) {
                setTimeout(oParams.hitCallback, 1500);
            } else {
                oOptions.hitCallback();
            }
        }
    };

    that.trackSelectApp = function (appid) {
        that.track({
            category: 'Marketplace',
            action: 'Marketplace-Select-App',
            label: appid
        });
    };

    that.trackInstallApp = function (appid, nComplete) {
        that.track({
            category: 'Marketplace',
            action: 'Marketplace-Install-' + nComplete === 0 ? 'Success' : 'Error',
            label: appid
        });
    };

    that.trackSubscribe = function (sEmail) {
        that.track({
            category: 'Subscribe',
            action: that.getDomainSource(),
            email: sEmail
        });
    };

    that.trackPrivateCloudEmail = function (sValue) {
        that.trackFormSubmitting('Private-Cloud', sValue);
        oMetrika.trackSubmitting(oMetrika.SUBMIT_PRIVATE_CLOUD_FREE_TRIAL);
    };

    that.trackPrivateLandingEmail = function (sValue) {
        that.trackFormSubmitting('Private-Landing', sValue);

        if (window.fbq) {
            window.fbq('track', 'CompleteRegistration');
        }

        oMetrika.trackSubmitting(oMetrika.SUBMIT_HOSTERS_REQUEST_INFORMATION);
    };

    that.trackHosterCloudFreeTrial = function (sValue) {
        that.trackFormSubmitting('Hosters-Trial-Request', sValue);
    };

    that.trackFormSubmitting = function (sForm, sValue, sRedirect) {
        that.track({
            category: "Submit-form",
            action: sForm,
            label: sValue,
            redirect: sRedirect
        });
    };

    that.trackSubmitRequestVPC = function (sValue) {
        that.trackFormSubmitting('VPC', sValue);
        oMetrika.trackSubmitting(oMetrika.SUBMIT_VIRTUAL_PRIVATE_CLOUD);
    };

    that.trackSubmitAboutEvents = function (sValue) {
        that.trackFormSubmitting('About-Events', sValue);
    };

    that.trackSubmitLandingVPC = function (sValue) {
        that.trackFormSubmitting('Landing-VPC', sValue);
        oMetrika.trackSubmitting(oMetrika.SUBMIT_LANDING_VPC);
    };

    that.trackSubmitPacketLanding = function (sValue) {
        that.trackFormSubmitting('Packet-Landing', sValue);
        oMetrika.trackSubmitting(oMetrika.SUBMIT_SPECIAL_HOSTER_LANDING);
    };

    that.trackSignupSuccess = function (sHoster, sLink) {

        var sDefault = JApp.isLoadedDefHoster() ? JApp.getDefaultHoster() : "notDefined";

        that.track({
            category: "signup",
            action: sHoster,
            label: sDefault + " >> " + sHoster,
            redirect: sLink
        });
    };

    that.trackSignupError = function (sHoster, sMsg) {
        that.track({
            category: "signup-error",
            action: sHoster,
            label: sMsg
        });
    };

    that.trackPageview = function (sPage, sTitle) {

        if (window.ga) {
            window.ga('send', 'pageview', {
                'page': sPage,
                'title': sTitle || ''
            });
        }
    };

    that.getDomainSource = function () {
        var sDomain = window.location.host,
            sSubDomain = sDomain.replace(".jelastic.com", ""),
            sSource = "Jelastic";

        if (sSubDomain !== sDomain) {
            sSource += "-" + JApp.utils.toCamelCase(sSubDomain);
        }

        return sSource;
    };

    return that;
}(JApp.GA || {}));

JApp.bind = (function (that) {
    var $body = $('body');

    that.miss = function (sTarget, callback) {

        $body.on('click.miss', function (e) {

            if (e.originalEvent && $(e.target).closest(sTarget).length === 0) {

                if (callback() === false) {
                    $body.off('click.miss');
                    return false;
                }
            }
        });
    };

    return that;
}(JApp.bind || {}));

JApp.user = (function (that) {
    that.signupErrors = {
        UNKNOWN: "Something went wrong. We suspect this was caused by network issues, so please try again in a few minutes. If your second attempt fails, please, email us at <a href='mailto:info@jelastic.com'>info@jelastic.com</a> to get the assistance with account creation.",
        ERROR_EMAIL: "The specified email address is not allowed for registration. Please use another email or contact us at <a href='mailto:info@jelastic.com'>info@jelastic.com</a> for the assistance.",
        EMAIL_DENY: "The specified email address is not allowed for registration. Please use another email or contact us at <a href='mailto:info@jelastic.com'>info@jelastic.com</a> for the assistance."
    };

    that.Signup = function (oData, sCurrentHoster, ops) {
        var oParams,
            oLocation = window.location,
            sReferrer = oLocation.href,
            sError,
            fCallback,
            bRedirect,
            sMarketingSource = JApp.GA.getDomainSource();

        if (document.referrer) {
            sReferrer += (oLocation.search ? "&" : "?") + "referrer=" + document.referrer;
        }

        function trackGA(success, sMsg, sLink) {
            sMsg = sMsg || "unknown";
            if (success === false) {
                JApp.GA.trackPageview("/signup/error");
                JApp.GA.trackSignupError(sCurrentHoster, sMsg);
            } else {
                JApp.GA.trackPageview("/signup/success");
                JApp.GA.trackSignupSuccess(sCurrentHoster, sLink);
            }
        }

        ops = ops || {};
        fCallback = ops.callback;
        bRedirect = ops.redirect !== false;

        oParams = JSON.stringify({
            "name": oData.name,
            "email": oData.email,
            "comment": oData.comment,
            "verifyKey": oData.verifyKey,
            "hoster": sCurrentHoster,
            "referrer": sReferrer,
            "marketing_source": sMarketingSource,
            "source": sMarketingSource,
            "lang": JApp.getLang() || (String(navigator.language || navigator.browserLanguage).toLowerCase()),
            "ext_referrer": $.cookie(JApp.COOKIE_EXTERNAL_REFERER),
            "utm_label": $.cookie(JApp.COOKIE_UTM_LABELS)
        });

        $.ajax({
            type: "POST",
            url: JApp.url.getSignupURL(),
            data: {
                "data": oParams
            },
            success: function (response) {
                var oResp = jQuery.parseJSON(response),
                    bSuccess = true,
                    nResult = oResp.result,
                    sMsg;

                if (oResp && nResult == 0 && oResp.response) {
                    oResp = oResp.response;
                    nResult = oResp.result;
                }

                if (!oResp || nResult != 0) {
                    bSuccess = false;
                }

                if (bSuccess === false) {
                    oResp = oResp || "Response is undefined";
                    sMsg = JSON.stringify(oResp);


                    switch (nResult) {
                        case 501:
                            sError = that.signupErrors.ERROR_EMAIL;
                            break;

                        case 508:
                            sError = that.signupErrors.EMAIL_DENY;
                            break;

                        case 10008:
                            sError = that.signupErrors.EMAIL_DENY;
                            JApp.utils.checkFraudEmail(oData.email);

                            break;

                        default:
                            sError = that.signupErrors.UNKNOWN;
                    }

                    JApp.utils.Modal.Massage({
                        title: "Registration failed",
                        msg: sError
                    });
                }

                trackGA(bSuccess, sMsg, String(oResp.app).indexOf("?") > -1 ? oResp.app : (oResp.app + '?signup=' + oResp.email));


                if (fCallback) {
                    fCallback(bSuccess, nResult);
                }
            },

            error: function (oJqXHR, textStatus, errorThrown) {

                console.log(1);

                JApp.utils.Modal.Massage({
                    title: "Registration failed",
                    msg: that.signupErrors.UNKNOWN
                });

                trackGA(false, (textStatus || "error") +
                    ": " +
                    (oJqXHR.status || "") +
                    (errorThrown || "unknown")
                );

                if (fCallback) {
                    fCallback(false);
                }
            }
        });
    };

    that.subscribe = function (sUrl, oData, fnCallback) {
        $.ajax({
            type: "POST",
            url: sUrl,
            data: oData,
            complete: function (oResponse) {
                var oResp = jQuery.parseJSON(oResponse.responseText),
                    nResult = oResp.result;

                if (oResp && oResp.result == 0) {
                    JApp.GA.trackSubscribe(oData.email);
                }

                if (fnCallback) {
                    fnCallback(nResult);
                }
            }
        });
    };

    return that;
}(JApp.user || {}));

JApp.debug = (function (that) {
    var bDebug = !!window.debugMode;
    that.log = function () {
        if (bDebug) {
            console.log.apply(console, arguments);
        }
    };

    that.info = function () {
        if (bDebug) {
            console.info.apply(console, arguments);
        }
    };

    return that;

}(JApp.debug || {}));
