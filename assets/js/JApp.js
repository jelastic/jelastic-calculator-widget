var JApp = window.JApp || {};
$ = $ || jQuery;

window.JApp = (function (that) {
    var sDefaultHoster = "eapps",
        sLoadedDefHoster = '',
        oLoadedHosters = {};

    that.getDefaultHoster = function () {
        return sLoadedDefHoster || sDefaultHoster;
    };

    that.isLoadedDefHoster = function () {
        return sLoadedDefHoster.length !== 0;
    };

    that.getHosters = function () {
        return oLoadedHosters;
    };

    that.isLoadedHosters = function () {
        return Object.keys(oLoadedHosters).length !== 0;
    };


    that.url = {

        getPlatformsInfoHost: function () {
            return "//platforms-info.jelastic.com";
        },

        getUserDefHosterURL: function () {
            return that.url.getPlatformsInfoHost() + "/api/user/getdefhoster";
        },

        getHosters: function () {
            return "//platforms-info.jelastic.com/api/site/GetHosters";
        },

        getPrices: function () {
            return "//platforms-info.jelastic.com/api/GetPricings";
        },

        getCurrecies: function () {
            return "//platforms-info.jelastic.com/api/GetCurrency";
        }

    };

    that.loadHosters = function (fnCallback) {
        $.ajax({
            type: "GET",
            url: JApp.url.getHosters(),
            async: true,
            success: function (response) {
                var oResp = '';
                if (response.result === 0 && response.hosters) {
                    oLoadedHosters = response.hosters;
                    
                    $.each(oLoadedHosters, function (index) {

                        if (this.keyword === 'servint' || this.hasSignup === false || this.hasSignup === undefined|| !this.hasSignup) {
                            delete oLoadedHosters[index];
                        }

                    });

                    oLoadedHosters = oLoadedHosters.filter(val => val);
                    

                    oLoadedHosters.sort(function (a, b) {
                        var nameA = a.keyword.toLowerCase(),
                            nameB = b.keyword.toLowerCase();
                        if (nameA < nameB)
                            return -1;
                        if (nameA > nameB)
                            return 1;
                        return 0;
                    });



                    if (fnCallback) {
                        fnCallback(oLoadedHosters);
                    }

                } else {
                    throw new Error('Can not get hosters');
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
            async: false,
            success: function (response) {
                var oResp = jQuery.parseJSON(response) || {};

                if (oResp.result === 0 && oResp.response) {
                    oResp = oResp.response;
                }

                sLoadedDefHoster = oResp.hoster;

                if (fnCallback) {
                    fnCallback(sLoadedDefHoster);
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

    return that;
}(window.JApp || {}));

JApp.pricing = (function (that) {

    var oPricing = {},
        oCurrencies = {};

    that.getPricing = function () {
        return oPricing;
    };

    that.getCurrecies = function () {
        return oCurrencies;
    };

    that.isLoadedPricing = function () {
        return Object.keys(oPricing).length !== 0;
    };

    that.isLoadedCurrencies = function () {
        return Object.keys(oCurrencies).length !== 0;
    };

    that.loadCurrencies = function (fnCallback) {
        $.ajax({
            type: "GET",
            url: JApp.url.getCurrecies(),
            dataType: "json",
            async: true,
            success: function (currencyJSON) {
                if (currencyJSON.result === 0) {

                    oCurrencies = currencyJSON.response.objects;

                    oCurrencies.sort(function (a, b) {
                        var nameA = a.code.toLowerCase(),
                            nameB = b.code.toLowerCase();
                        if (nameA < nameB)
                            return -1;
                        if (nameA > nameB)
                            return 1;
                        return 0;
                    });

                    $.each(oCurrencies, function (index) {
                        if (this.code === 'USD' || this.code === 'EUR') {
                            oCurrencies.splice(0, 0, oCurrencies.splice(index, 1)[0]);
                        }
                    });

                    if (fnCallback) {
                        fnCallback(oCurrencies);
                    }
                }
            },
            error: function (response) {
                throw new Error(response);
            }
        });
    };

    that.loadPricings = function (fnCallback) {
        $.ajax({
            type: "GET",
            url: JApp.url.getPrices(),
            dataType: "json",
            async: true,
            success: function (pricingJSON) {
                if (pricingJSON.result === 0) {
                    oPricing = pricingJSON.response.pricings;

                    if (fnCallback) {
                        fnCallback(oPricing);
                    }

                } else {
                    throw new Error('Can not get pricing models');
                }
            },
            error: function (response) {
                throw new Error(response);
            }
        });
    };

    return that;
}(JApp.pricing || {}));

