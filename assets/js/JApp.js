var JApp = window.JApp || {};
$ = $ || jQuery;

JApp.pricing = (function (that) {

    var oPricing = {},
        oCurrencies = {},
        sDefaultHoster = "eapps",
        sLoadedDefHoster = '',
        oLoadedHosters = {};

    that.url = {

        getPlatformsInfoHost: function () {
            return "https://platforms-info.jelastic.com";
        },

        getCloudHost: function () {
            return "https://jelastic.cloud";
        },

        getUserDefHosterURL: function () {
            return that.url.getPlatformsInfoHost() + "/api/user/getdefhoster";
        },

        getHosters: function () {
            return that.url.getCloudHost() + "/wp-json/jelastic/hosters/";
        },

        getPrices: function () {
            return that.url.getCloudHost() + "/wp-json/jelastic/pricing/";
        },

        getCurrecies: function () {
            return that.url.getCloudHost() + "/wp-json/jelastic/pricing/currency/";
        }

    };

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
            url: JApp.pricing.url.getCurrecies(),
            dataType: "json",
            async: true,
            success: function (currencyJSON) {
                if (currencyJSON.response) {

                    oCurrencies = currencyJSON.response;

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
            url: JApp.pricing.url.getPrices(),
            dataType: "json",
            async: true,
            success: function (pricingJSON) {
                if (pricingJSON.response) {
                    oPricing = pricingJSON.response;

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

    that.loadHosters = function (fnCallback) {
        $.ajax({
            type: "GET",
            url: JApp.pricing.url.getHosters(),
            async: true,
            success: function (response) {

                if (response.response) {
                    oLoadedHosters = [];

                    $.each(response.response, function (index) {
                        if (this.keyword !== 'servint' && this.hasSignup === true) {
                            oLoadedHosters.push(this);
                        }
                    });

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
            url: JApp.pricing.url.getUserDefHosterURL(),
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
}(JApp.pricing || {}));

