var JApp = window.JApp || {};
$ = $ || jQuery;

window.JApp = (function (that) {
    var sDefaultHoster = "eapps",
        sLoadedDefHoster = '';

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

        getUserDefHosterURL: function () {
            return that.url.getPlatformsInfoHost() + "/api/user/getdefhoster";
        },

        getHosters: function () {
            return "//platforms-info.jelastic.com/api/site/GetHosters";
        },

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

    return that;
}(window.JApp || {}));


JApp.utils = (function (that) {

    that.uniqid = (function (a = "", b = false) {
        var c = Date.now() / 1000;
        var d = c.toString(16).split(".").join("");
        while (d.length < 14) {
            d += "0";
        }
        var e = "";
        if (b) {
            e = ".";
            var f = Math.round(Math.random() * 100000000);
            e += f;
        }
        return a + d + e;
    });

    return that;
}(JApp.utils || {}));
