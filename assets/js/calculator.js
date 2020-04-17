jQuery(document).ready(function ($) {

        var calculatorTag = $('.j-calculator'),
            sHtml = '',
            sCurrentHoster = 'servint',
            bInitDefCor,
            fnSetDefault,
            fnInitDefaultHoster,
            oHosters = [],
            pricing = '',
            currency = '',
            calculatorsWithSelector = [],
            hSelectBlockClass = '.hoster-selector',
            hSelectClass = '.hoster-selector--select',
            calculatorBlockClass = '.calculator-wrapper',
            sCssLoading = 'loading';

        $(calculatorTag).addClass(sCssLoading);


        function renderHosterSelector(el) {

            oHosters.sort(function (a, b) {
                var nameA = a.keyword.toLowerCase(),
                    nameB = b.keyword.toLowerCase();
                if (nameA < nameB)
                    return -1;
                if (nameA > nameB)
                    return 1;
                return 0;
            });

            sHtml = new EJS({url: '/j-calculator/templates/hoster-selector'}).render({
                hSelectBlockClass: hSelectBlockClass.replace('.', ''),
                hSelectClass: hSelectClass.replace('.', ''),
                txChoose: 'Choose Service Provider of Jelastic Public Cloud',
                txPerfomance: 'Perfomance',
                txSupport: 'Support',
                txLocation: 'Location',
                txServices: 'Advanced Services',
                defHoster: sCurrentHoster,
                hosters: oHosters
            });

            for (var i = 0, oHoster; oHoster = oHosters[i]; i++) {
                if (sCurrentHoster === oHoster.keyword) {
                    $(el).attr('data-key', oHoster.key);
                }
            }

            if ($(el).find(hSelectBlockClass).length > 0) {
                $(el).find(hSelectBlockClass).replaceWith(sHtml);
            } else {
                $(el).append(sHtml);
            }

            $(el).find('select').each(function () {
                var $this = $(this), numberOfOptions = $(this).children('option').length;

                $this.addClass('select-hidden');
                $this.wrap('<div class="select"></div>');
                $this.after('<div class="select-styled"></div>');

                var $styledSelect = $this.next('div.select-styled');
                $styledSelect.text($this.children('option:selected').text());

                var $list = $('<ul />', {
                    'class': 'select-options'
                }).insertAfter($styledSelect);

                for (var i = 0; i < numberOfOptions; i++) {
                    $('<li />', {
                        text: $this.children('option').eq(i).text(),
                        rel: $this.children('option').eq(i).val()
                    }).appendTo($list);
                }

                var $listItems = $list.children('li');

                $styledSelect.click(function (e) {
                    e.stopPropagation();
                    $('div.select-styled.active').not(this).each(function () {
                        $(this).removeClass('active').next('ul.select-options').hide();
                    });
                    $(this).toggleClass('active').next('ul.select-options').toggle();
                });

                $listItems.click(function (e) {
                    e.stopPropagation();
                    $styledSelect.text($(this).text()).removeClass('active');
                    $this.val($(this).attr('rel')).change();
                    $list.hide();
                });

                $(document).click(function () {
                    $styledSelect.removeClass('active');
                    $list.hide();
                });

            });


        }

        function renderCalculator(el) {

            var oLanguages = $(el).data('languages') || ['java', 'php', 'node', 'ruby', 'python', 'go'],
                fixed = '',
                dynamic = '',
                ip = '',
                storage = '',
                usdRate = 1,
                period = $(el).attr('data-period') || 'hourly';

            if (!Array.isArray(oLanguages)) {
                oLanguages = oLanguages.split(",").map(function(item) {
                    return item.trim();
                });
            }

            sHtml = new EJS({url: '/j-calculator/templates/calculator'}).render({
                calculatorBlockClass: calculatorBlockClass.replace('.', ''),
                oLanguages: oLanguages,
                id: Math.round(Math.random() * 100000000),

                balancerMin: parseInt($(el).attr('data-balancer-min')) || 0,
                balancerMax: parseInt($(el).attr('data-balancer-max')) || 128,

                balancerReserved: parseInt($(el).attr('data-balancer-reserved')) || 0,
                balancerScaling: parseInt($(el).attr('data-balancer-scaling')) || 0,

                appServerMin: parseInt($(el).attr('data-appserver-min')) || 0,
                appServerMax: parseInt($(el).attr('data-appserver-max')) || 128,

                appServerReserved: parseInt($(el).attr('data-appserver-reserved')) || 1,
                appServerScaling: parseInt($(el).attr('data-appserver-scaling')) || 64,

                databaseMin: parseInt($(el).attr('data-database-min')) || 0,
                databaseMax: parseInt($(el).attr('data-database-max')) || 128,

                databaseReserved: parseInt($(el).attr('data-database-reserved')) || 0,
                databaseScaling: parseInt($(el).attr('data-database-scaling')) || 0,
            });

            if ($(el).find(calculatorBlockClass).length > 0) {
                $(el).find(calculatorBlockClass).replaceWith(sHtml);
            } else {
                $(el).append(sHtml);
            }

            $(el).attr('data-mode', 'appserver');
            for (var i = 0, oHoster; oHoster = oHosters[i]; i++) {
                if ($(el).attr('data-key') === oHoster.key) {
                    $(el).attr('data-currency', oHoster.currencyCode);
                }
            }
            
            var defaultOptions = {
                "storage": $(el).attr('data-storage') || 10,
                "ip": $(el).attr('data-ip') || 10,
                "traffic": $(el).attr('data-traffic') || 10,
            };
            $.each(defaultOptions, function (key, value) {
                $(el).attr('data-' + key, value).find('[name='+key+']').val(value).change();

                if (value > parseInt($(el).attr('data-' + key, value).find('[name='+key+']').attr('max'))) {
                    $(el).attr('data-' + key, value).find('[name='+key+']').val($(el).attr('data-' + key, value).find('[name='+key+']').attr('max')).change();
                }

            });

            $(el).attr('data-period', period);
            $(el).find('input[value=' + period + ']').attr('checked', 'checked').change();

            var sKey = window.pricing[$(el).attr('data-key')],
                hosterCurrency = $(el).attr('data-currency'),
                tariffPlans = sKey.tariffPlans;
            
            if (tariffPlans.length > 0) {
                $.each(tariffPlans, function () {
                    if (this.type.toLowerCase() === 'fixed') {
                        fixed = this;
                    }
                    if (this.type.toLowerCase() === 'flexible') {
                        dynamic = this;
                    }
                    if (this.type.toLowerCase() === 'storage') {
                        storage = this;
                    }
                    if (this.keyword.toLowerCase() === 'ip') {
                        ip = this;
                    }
                });
            }

            $.each(window.currency, function () {
                if (this.code === hosterCurrency) {
                    usdRate = this.usdRate;
                }
            });


            $add.Slider = function (el, settings) {
                var $el = $(el);
                var s = {};
                if ($el.attr("name"))
                    s.name = $el.attr("name");
                if ($el.attr("class"))
                    s.class = $el.attr("class");
                if ($el.attr("id"))
                    s.id = $el.attr("id");
                if ($el.attr("value"))
                    s.value = $el.attr("value");
                if ($el.attr("min"))
                    s.min = $el.attr("min");
                if ($el.attr("max"))
                    s.max = $el.attr("max");
                if ($el.attr("step"))
                    s.step = $el.attr("step");

                s.storage = storage;
                s.ip = ip;

                s.fixed = fixed;
                s.dynamic = dynamic;
                s.usdRate = usdRate;

                settings = $.extend(s, $el.data(), settings);


                var S = new $add.SliderObj(settings);
                S.render($el, "replace");
                return S;
            };

            var appserverslider = $add.Slider($(el).find('.appserver-range input'), ''),
                balancerslider = $add.Slider($(el).find('.balancer-range input'), ''),
                databaseslider = $add.Slider($(el).find('.database-range input'), '');

            var sliders = {
                'appserver': appserverslider,
                'balancer': balancerslider,
                'database': databaseslider,
            };


            $(el).find('input[name*="mode"]').click(function (e) {
                changeMode($(this).val(), el);
                setMinValues(el, $(el).attr('data-mode'));
                setMaxValues(el, $(el).attr('data-mode'));
            });
            $(el).find('input[name*="mode"][value=appserver]').click();
            $(el).find('.min-block-decrease').click(function (e) {
                e.preventDefault();
                var slider = sliders[$(el).attr('data-mode')];
                decreaseReserved(slider);
            });
            $(el).find('.min-block-increase').click(function (e) {
                e.preventDefault();
                var slider = sliders[$(el).attr('data-mode')];
                increaseReserved(slider);
            });
            $(el).find('.max-block-decrease').click(function (e) {
                e.preventDefault();
                var slider = sliders[$(el).attr('data-mode')];
                decreaseScaling(slider);
            });
            $(el).find('.max-block-increase').click(function (e) {
                e.preventDefault();
                var slider = sliders[$(el).attr('data-mode')];
                increaseScaling(slider);
            });
            $(el).find('.digit').change(function (e) {
                var type = $(this).attr('name');
                $(el).attr('data-' + type, $(this).val());

                var digit = $(this);

                if (parseInt(digit.val()) > parseInt(digit.attr('max'))) {
                    digit.val(digit.attr('max')).change();
                }

                if (parseInt(digit.val()) < 0) {
                    digit.val(0).change();
                }

                setMinPrice(fixed.tiers, el, usdRate, storage.tiers, ip.tiers);
            });
            $(el).find('.plus').click(function (e) {
                e.preventDefault();
                increaseBlockDigit(this);
            });
            $(el).find('.minus').click(function (e) {
                e.preventDefault();
                decreaseBlockDigit(this);
            });
            $(el).find('.calculator-right input').click(function (e) {
                $(el).attr('data-period', $(this).val());
                setMinPrice(fixed.tiers, el, usdRate, storage.tiers, ip.tiers);
                setMaxPrice(dynamic.tiers, fixed.tiers, el, usdRate);
            });


            $(calculatorTag).removeClass(sCssLoading);

        }


        function decreaseReserved(oSlider) {
            var l = oSlider.value.split(',')[0];
            var r = oSlider.value.split(',')[1];
            if (l > oSlider._settings.min) {
                l--;
                oSlider.value = '' + l + ',' + r + '';
            }
        }

        function increaseReserved(oSlider) {
            var l = oSlider.value.split(',')[0];
            var r = oSlider.value.split(',')[1];
            if (l < oSlider._settings.max) {
                if (l === r) {
                    r++;
                }
                l++;
                oSlider.value = '' + l + ',' + r + '';
            }
        }

        function decreaseScaling(oSlider) {
            var l = oSlider.value.split(',')[0];
            var r = oSlider.value.split(',')[1];
            if (r > oSlider._settings.min) {
                if (l === r) {
                    l--;
                }
                r--;

                oSlider.value = '' + l + ',' + r + '';
            }
        }

        function increaseScaling(oSlider) {
            var l = oSlider.value.split(',')[0];
            var r = oSlider.value.split(',')[1];
            if (r < oSlider._settings.max) {
                r++;
                oSlider.value = '' + l + ',' + r + '';
            }
        }

        function increaseBlockDigit(clickedElement) {
            var digit = $(clickedElement).closest('.inner').find('.digit');
                digit.val(parseInt(digit.val()) + 1).change();
        }

        function decreaseBlockDigit(clickedElement) {
            var digit = $(clickedElement).closest('.inner').find('.digit');
            if (parseInt(digit.val()) > 0) {
                digit.val(parseInt(digit.val()) - 1).change();
            }
        }

        function importPricing() {
            $.ajax({
                type: "GET",
                url: '//platforms-info.jelastic.com/api/GetPricings',
                dataType: "json",
                success: function (pricingJSON) {
                    if (pricingJSON.result === 0) {
                        window.pricing = pricingJSON.response.pricings;
                        $.ajax({
                            type: "GET",
                            url: '//platforms-info.jelastic.com/api/GetCurrency',
                            dataType: "json",
                            success: function (currencyJSON) {
                                if (currencyJSON.result === 0) {
                                    window.currency = currencyJSON.response.objects;

                                    JApp.loadHosters(function (hosters) {
                                        oHosters = hosters;

                                        if (calculatorTag.length > 0) {
                                            $.each(calculatorTag, function (e) {
                                                $(this).attr('data-key') ? renderCalculator($(this)) : calculatorsWithSelector.push(this);
                                            });
                                        }

                                        fnSetDefault();

                                    });

                                }
                            }
                        });
                    }
                }
            });
        }
        importPricing();


        $(window).resize(function () {
            $('.j-calculator[data-mode]').each(function () {
                setMinValues(this, $(this).attr('data-mode'));
                setMaxValues(this, $(this).attr('data-mode'));
            });
        });

        function uniqid(a = "", b = false) {
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
        }

        function changeMode(value, el) {
            $(el).attr('data-mode', value);
        }

        function setReservedCloudlets(cloudlets, el, type) {
            $(el).attr('data-' + type + '-reserved', cloudlets);
            setMinValues(el, type);
        }

        function setScalingCloudlets(cloudlets, el, type) {
            if(cloudlets === 0) {
                $(el).find('label[for*=' + type + ']').removeClass('active');
            } else {
                $(el).find('label[for*=' + type + ']').addClass('active');
            }

            var ip_input = $(el).find('[name=ip]'),
                labelWrapper = $(el).find('.calculator-left-top-chooser-left label.active');

            ip_input.attr('max', parseInt(labelWrapper.length));
            if (parseInt(ip_input.val()) > parseInt(ip_input.attr('max'))){
                ip_input.val(parseInt(ip_input.attr('max')));
                $(el).attr('data-ip', parseInt(ip_input.attr('max')));
            }

            $(el).attr('data-' + type + '-scaling', cloudlets);
            setMaxValues(el, type);
        }

        function getReservedCloudlets(el, type) {
            return parseInt($(el).attr('data-' + type + '-reserved'));
        }

        function getScalingCloudlets(el, type) {
            return parseInt($(el).attr('data-' + type + '-scaling'));
        }

        function convertMib(value) {
            value *= 128;
            return value > 1000 ? parseFloat(value / 1000).toFixed(2) + " GiB" : value + " MiB";
        }

        function convertMhz(value) {
            value *= 400;
            return value > 1000 ? parseFloat(value / 1000).toFixed(2) + " GHz" : value + " MHz";
        }

        function changePricePeriod(sValue, sPeriod) {
            switch (sPeriod) {
                case 'hourly':
                    sValue = Math.ceil(sValue * 1000) / 1000;
                    break;

                case 'monthly':
                    sValue = (sValue * 730).toFixed(2);
                    break
            }
            return sValue;
        }

        function checkStoragePrice(sValue, tiers) {
            sValue = parseInt(sValue);
            var price = tiers[0].price;

            if (sValue < tiers[0].value) {
                return 0;
            }

            for (var i = 0; i < tiers.length; i++) {
                if (!tiers[i + 1]) {
                    if ((tiers[tiers.length - 1].free > 0) && (sValue <= tiers[tiers.length - 1].free)) {
                        return 0;
                    } else {
                        price = tiers[tiers.length - 1].price;
                    }
                } else {
                    if ((sValue >= tiers[i].value) && (sValue < tiers[i + 1].value)) {
                        if ((tiers[i].free > 0) && (sValue <= tiers[i].free)) {
                            return 0;
                        } else {
                            price = tiers[i].price;
                            return sValue * price;
                        }
                    }
                }
            }
            return sValue * price;
        }

        function checkIpPrice(sValue, tiers) {
            sValue = parseInt(sValue);
            var price = tiers[0].price;

            if (sValue < tiers[0].value) {
                return 0;
            }

            for (var i = 0; i < tiers.length; i++) {
                if (!tiers[i + 1]) {
                    if ((tiers[tiers.length - 1].free > 0) && (sValue <= tiers[tiers.length - 1].free)) {
                        return 0;
                    } else {
                        price = tiers[tiers.length - 1].price;
                    }
                } else {
                    if ((sValue >= tiers[i].value) && (sValue < tiers[i + 1].value)) {
                        if ((tiers[i].free > 0) && (sValue <= tiers[i].free)) {
                            return 0;
                        } else {
                            price = tiers[i].price;
                            return sValue * price;
                        }
                    }
                }
            }
            return sValue * price;
        }

        function setMinPrice(reservedTiers, el, usdRate, storageTiers, ipTiers) {
            var minBalancerPrice = checkPrice(getReservedCloudlets(el, 'balancer'), reservedTiers),
                minAppserverPrice = checkPrice(getReservedCloudlets(el, 'appserver'), reservedTiers),
                minDatabasePrice = checkPrice(getReservedCloudlets(el, 'database'), reservedTiers),
                storagePrice = checkStoragePrice($(el).attr('data-storage'), storageTiers),
                ipPrice = checkIpPrice($(el).attr('data-ip'), ipTiers),
                minPrice = minBalancerPrice + minAppserverPrice + minDatabasePrice + storagePrice + ipPrice;
            minPrice = toUSD(minPrice, usdRate);
            minPrice = changePricePeriod(minPrice, $(el).attr('data-period'));
            $(el).find('.start-price .price').html('$' + minPrice);
        }

        function setMaxPrice(scalingTiers, reservedTiers, el, usdRate) {
            var maxBalancerPrice = checkMaxPrice(getScalingCloudlets(el, 'balancer'), scalingTiers, getReservedCloudlets(el, 'balancer'), reservedTiers),
                maxAppserverPrice = checkMaxPrice(getScalingCloudlets(el, 'appserver'), scalingTiers, getReservedCloudlets(el, 'appserver'), reservedTiers),
                maxDatabasePrice = checkMaxPrice(getScalingCloudlets(el, 'database'), scalingTiers, getReservedCloudlets(el, 'database'), reservedTiers),
                maxPrice = maxBalancerPrice + maxAppserverPrice + maxDatabasePrice;

            maxPrice = toUSD(maxPrice, usdRate);
            maxPrice = changePricePeriod(maxPrice, $(el).attr('data-period'));
            $(el).find('.max-price .price').html('$' + maxPrice);
        }

        function checkPrice(cloudlets, tiers) {
            var price = tiers[0].price;
            for (var i = 0; i < tiers.length; i++) {
                if (!tiers[i + 1]) {
                    price = tiers[tiers.length - 1].price;
                } else {
                    if ((cloudlets >= tiers[i].value) && (cloudlets < tiers[i + 1].value)) {
                        price = tiers[i].price;
                        return cloudlets * price;
                    }
                }
            }
            return cloudlets * price;
        }

        function checkMaxPrice(cloudlets, tiers, minCloudlets, minTiers) {

            if (cloudlets === 0) {
                return 0;
            }

            var reservedPrice = checkPrice(minCloudlets, minTiers),
                scalingCloudlets = cloudlets - minCloudlets;
            if (cloudlets === minCloudlets) {
                return reservedPrice;
            }

            var price = tiers[0].price;
            for (var i = 0; i < tiers.length; i++) {
                if (!tiers[i + 1]) {
                    price = tiers[tiers.length - 1].price;
                } else {
                    if ((scalingCloudlets >= tiers[i].value) && (scalingCloudlets < tiers[i + 1].value)) {
                        if (tiers[i].free > 0) {
                            if (scalingCloudlets <= tiers[i].free) {
                                return reservedPrice;
                            } else {
                                price = tiers[i].price;
                                break;
                            }
                        } else {
                            price = tiers[i].price;
                            break;
                        }
                    }
                }
            }

            return (scalingCloudlets * price) + reservedPrice;
        }

        function toUSD(sValue, sUsdRate) {
            return sValue * sUsdRate;
        }

        function setMinValues(el, type) {

            var value = getReservedCloudlets(el, type);

            // render line from dot to range
            var leftRange = $(el).find('.' + type + '-range .addui-slider-handle').eq(0),
                leftDot = $(el).find('.' + type + '-range .reserved .dot');
            var distance = leftRange.offset().left - $(leftDot).offset().left + $(leftDot).outerWidth() + 10;
            if (distance > 0) {
                $(leftDot).html('<span class="line more" style="width:' + (distance + 2 )+ 'px"></span>');
            } else {
                $(leftDot).html('<span class="line less" style="width:' + Math.abs(distance) + 'px"></span>');
            }

            // change reserved cloudlets
            var mib = convertMib(value);
            var mhz = convertMhz(value);
            $(el).find('.' + type + '-range .min-block .digits').html('<span>' + mib + '</span><span>' + mhz + '</span>')

        }

        function setMaxValues(el, type) {

            var value = getScalingCloudlets(el, type);

            // render line from dot to range
            var rightRange = $(el).find('.' + type + '-range .addui-slider-handle').eq(1),
                rightDot = $(el).find('.' + type + '-range .sl .dot');
            var distance = rightRange.offset().left - $(rightDot).offset().left + $(rightDot).outerWidth() + 10;
            if (distance > 0) {
                $(rightDot).html('<span class="line more" style="width:' + (distance + 2) + 'px"></span>');
            } else {
                $(rightDot).html('<span class="line less" style="width:' + Math.abs(distance) + 'px"></span>');
            }

            // change scaling limits
            var mib = convertMib(value);
            var mhz = convertMhz(value);
            $(el).find('.' + type + '-range .max-block .digits').html('<span>' + mib + '</span><span>' + mhz + '</span>')
        }

        fnSetDefault = function () {
            var sHosterCriteria = uniqid();
            if (JApp.isLoadedDefHoster()) {
                return fnInitDefaultHoster();
            } else {
                return JApp.loadDefaultHoster(fnInitDefaultHoster, sHosterCriteria);
            }
            bInitDefCor = false;
        };
        fnInitDefaultHoster = function (sHoster) {
            sCurrentHoster = sHoster || JApp.getDefaultHoster();
            if (calculatorsWithSelector.length > 0) {
                $.each(calculatorsWithSelector, function () {
                    renderHosterSelector($(this));
                    renderCalculator($(this));
                })
            }
        };

        $(document).on('change', hSelectClass, function (e) {
            var calculatorElement = $(this).closest(calculatorTag);
            sCurrentHoster = $(this).val();
            renderHosterSelector(calculatorElement);
            renderCalculator(calculatorElement);
        });


        if ($add === undefined) var $add = {version: {}, auto: {disabled: false}};
        $add.version.Slider = "2.0.1";
        $add.SliderObj = function (settings) {
            Obj.apply(this);

            function toNearest(num, x) {
                return (Math.round(num * (1 / x)) / (1 / x));
            }

            function betterParseFloat(t) {
                return isNaN(parseFloat(t)) && t.length > 0 ? betterParseFloat(t.substr(1)) : parseFloat(t)
            };

            this._settings = {
                direction: "horizontal",
                min: 0,
                max: 100,
                step: 0.1,
                value: 50,
                formatter: function (x) {
                    if ((this._settings.step + "").indexOf(".") > -1)
                        var digits = (this._settings.step + "").split(".").pop().length;
                    else
                        var digits = 0;
                    var v = betterParseFloat(x);
                    if (x < 0) {
                        var neg = true;
                        x = 0 - x;
                    } else {
                        var neg = false;
                    }
                    if (isNaN(x)) {
                        return "NaN";
                    }
                    var whole = Math.floor(x);
                    var dec = (x - whole);
                    dec = Math.round(dec * Math.pow(10, digits));
                    dec = dec + "";
                    while (dec.length < digits) {
                        dec = "0" + dec;
                    }
                    return ((neg) ? "-" : "") + whole + ((digits > 0) ? "." + dec : "");
                },
                timeout: 2000,
                range: false,
                id: false,
                name: "",
                class: "",
                fixed: "",
                dynamic: "",
                usdRate: ""
            };
            Object.defineProperty(this, "settings", {
                get: function () {
                    this.trigger("getsetting settings", this._settings);
                    return this._settings;
                },
                set: function (newSettings) {
                    this._settings = $.extend(this._settings, settings);
                    this.trigger("setsettings settings", this._settings);
                    this.refresh();
                }
            });
            Object.defineProperty(this, "value", {
                get: function () {
                    this.trigger("getvalue value", this._settings.value);
                    return this._settings.value;
                },
                set: function (newVal) {

                    var self = this;
                    this._settings.value = newVal;

                    this._elements.find(".addui-slider-input").val(this._settings.value);
                    if (!this._settings.range) {
                        var offset = betterParseFloat(this._settings.value) - this._settings.min;
                        var per = (toNearest(offset, this._settings.step) / (this._settings.max - this._settings.min)) * 100;
                        if (this._settings.direction == "vertical") {
                            this._elements.find(".addui-slider-handle").css("bottom", per + "%");
                            this._elements.find(".addui-slider-range").css("height", per + "%");
                            this._elements.find(".addui-slider-range").css("bottom", "0%");
                        } else {
                            this._elements.find(".addui-slider-handle").css("left", per + "%");
                            this._elements.find(".addui-slider-range").css("width", per + "%");
                        }
                        this._elements.find(".addui-slider-value span").html(toFunc(this._settings.formatter).call(this, this._settings.value));
                    } else {
                        
                        var l = (toNearest(parseFloat(this._settings.value.split(",")[0]), this._settings.step));
                        var h = (toNearest(parseFloat(this._settings.value.split(",")[1]), this._settings.step));
                        var range = this._settings.max - this._settings.min;
                        var offsetL = l - this._settings.min;
                        var offsetH = h - this._settings.min;
                        var lPer = (offsetL / range) * 100;
                        var hPer = (offsetH / range) * 100;

                        this._elements.each(function (i, el) {
                            var $el = $(el),
                                calc = $el.closest('.j-calculator'),
                                type = $($el.closest('[class*="-range"'))[0].className.replace('-range', '');

                            if (self._settings.direction == "vertical") {
                                $el.find(".addui-slider-handle").eq(0).css("bottom", lPer + "%");
                                $el.find(".addui-slider-handle").eq(1).css("bottom", hPer + "%");
                                $el.find(".addui-slider-range").css("bottom", lPer + "%").css("height", (hPer - lPer) + "%");
                            } else {
                                $el.find(".addui-slider-start-distance").css("width", "calc(" + lPer + "% + 30px)");
                                $el.find(".addui-slider-handle").eq(0).css("left", lPer + "%");
                                $el.find(".addui-slider-handle").eq(1).css("left", hPer + "%");
                                $el.find(".addui-slider-range").css("left", lPer + "%").css("width", (hPer - lPer) + "%");
                                $el.find(".addui-slider-distance").css("width", "calc(" + (100 - hPer ) + "% + 31px)");
                            }

                            $el.find(".addui-slider-handle").eq(0).find(".addui-slider-value span").html(toFunc(self._settings.formatter).call(self, l));
                            $el.find(".addui-slider-handle").eq(1).find(".addui-slider-value span").html(toFunc(self._settings.formatter).call(self, h));

                            setReservedCloudlets(l, calc, type);
                            setScalingCloudlets(h, calc, type);
                            setMinPrice(self._settings.fixed.tiers, calc, self._settings.usdRate, self._settings.storage.tiers, self._settings.ip.tiers);
                            setMaxPrice(self._settings.dynamic.tiers, self._settings.fixed.tiers, calc, self._settings.usdRate);
                        });
                    }
                }
            });

            this.renderer = function () {
                var self = this;
                var $slider = $("<div class='addui-slider addui-slider-" + this._settings.direction + ((this._settings.range) ? " addui-slider-isrange" : "") + " " + this._settings.class + "' " + ((this._settings.id) ? "id='" + this._settings.id + "'" : "") + "></div>");
                var $input = $("<input class='addui-slider-input' type='hidden' name='" + this._settings.name + "' value='" + this._settings.value + "' />").appendTo($slider);
                var $track = $("<div class='addui-slider-track'></div>").appendTo($slider);
                var $range = $("<div class='addui-slider-range'></div>").appendTo($track);

                if (!this._settings.range) {
                    var $handle = $("<div class='addui-slider-handle'><div class='addui-slider-value'><span></span></div></div>").appendTo($track);
                    var activeTimer = null;

                    function dragHandler(e) {
                        e.preventDefault();
                        if (self._settings.direction == "vertical") {
                            if (e.type == "touchmove")
                                var y = e.originalEvent.changedTouches[0].pageY;
                            else
                                var y = e.pageY;
                            var sliderY = $slider.offset().top + $slider.height();
                            var offsetY = sliderY - y;
                            var offsetPer = (offsetY / $slider.height()) * 100;
                        } else {
                            if (e.type == "touchmove")
                                var x = e.originalEvent.changedTouches[0].pageX;
                            else
                                var x = e.pageX;
                            var sliderX = $slider.offset().left;
                            var offsetX = x - sliderX;
                            var offsetPer = (offsetX / $slider.width()) * 100;
                        }

                        var val = toNearest((offsetPer / 100) * (self._settings.max - self._settings.min), self._settings.step) + self._settings.min;
                        val = Math.min(self._settings.max, Math.max(self._settings.min, val));
                        self.value = toNearest(val, self._settings.step);

                    };

                    function dragStopHandler(e) {
                        $(window).off("mousemove touchmove", dragHandler);
                        activeTimer = setTimeout(function () {
                            $handle.removeClass("addui-slider-handle-active");
                        }, self._settings.timeout);
                    };
                    $handle.on("mousedown touchstart", function (e) {
                        clearTimeout(activeTimer);
                        $handle.addClass("addui-slider-handle-active");
                        $(window).on("mousemove touchmove dragmove", dragHandler);
                        $(window).one("mouseup touchend", dragStopHandler);
                    });
                    $slider.on("click", function (e) {
                        e.preventDefault();

                        if (self._settings.direction == "vertical") {
                            if (e.type == "touchmove")
                                var y = e.originalEvent.changedTouches[0].pageY;
                            else
                                var y = e.pageY;
                            var sliderY = $slider.offset().top + $slider.height();
                            var offsetY = sliderY - y;
                            var offsetPer = (offsetY / $slider.height()) * 100;
                        } else {
                            if (e.type == "touchmove")
                                var x = e.originalEvent.changedTouches[0].pageX;
                            else
                                var x = e.pageX;
                            var sliderX = $slider.offset().left;
                            var offsetX = x - sliderX;
                            var offsetPer = (offsetX / $slider.width()) * 100;
                        }

                        var val = toNearest((offsetPer / 100) * (self._settings.max - self._settings.min), self._settings.step) + self._settings.min;
                        val = Math.min(self._settings.max, Math.max(self._settings.min, val));
                        clearTimeout(activeTimer);
                        $handle.addClass("addui-slider-handle-active");
                        activeTimer = setTimeout(function () {
                            $handle.removeClass("addui-slider-handle-active");
                        }, self._settings.timeout);
                        self.value = val;
                    });
                } else {
                    var $startDistance = $("<div class='addui-slider-start-distance'></div>").appendTo($track);
                    var $handle1 = $("<div class='addui-slider-handle addui-slider-handle-l'><div class='addui-slider-value'><span></span></div></div>").appendTo($track);
                    var activeTimer1 = null;


                    function dragHandler1(e) {
                        e.preventDefault();
                        if (self._settings.direction == "vertical") {
                            if (e.type == "touchmove")
                                var y = e.originalEvent.changedTouches[0].pageY;
                            else
                                var y = e.pageY;
                            var sliderY = $slider.offset().top + $slider.height();
                            var offsetY = sliderY - y;
                            var range = self._settings.max - self._settings.min;
                            var offsetPer = (offsetY / $slider.height()) * 100;
                        } else {
                            if (e.type == "touchmove")
                                var x = e.originalEvent.changedTouches[0].pageX;
                            else
                                var x = e.pageX;
                            var sliderX = $slider.offset().left;
                            var offsetX = x - sliderX;
                            var range = self._settings.max - self._settings.min;
                            var offsetPer = (offsetX / $slider.width()) * 100;
                        }


                        var offsetVal = offsetPer / 100 * range;
                        var val = toNearest(offsetVal + self._settings.min, self._settings.step);
                        val = Math.min(self._settings.max, Math.max(self._settings.min, val));
                        var higherVal = toNearest(betterParseFloat(self._settings.value.split(',')[1]), self._settings.step);
                        if (higherVal < val)
                            higherVal = val;
                        self.value = val + "," + higherVal;
                    };


                    function dragStopHandler1(e) {
                        $(window).off("mousemove touchmove", dragHandler1);
                        activeTimer1 = setTimeout(function () {
                            $handle1.removeClass("addui-slider-handle-active");
                        }, self._settings.timeout);
                    };
                    $handle1.on("mousedown touchstart", function (e) {
                        clearTimeout(activeTimer1);
                        $handle1.addClass("addui-slider-handle-active");
                        $(window).on("mousemove touchmove dragmove", dragHandler1);
                        $(window).one("mouseup touchend", dragStopHandler1);
                    });

                    var $handle2 = $("<div class='addui-slider-handle addui-slider-handle-h'><div class='addui-slider-value'><span></span></div></div>").appendTo($track);
                    var activeTimer2 = null;

                    var $distance = $("<div class='addui-slider-distance'></div>").appendTo($track);


                    function dragHandler2(e) {
                        e.preventDefault();
                        if (self._settings.direction == "vertical") {
                            if (e.type == "touchmove")
                                var y = e.originalEvent.changedTouches[0].pageY;
                            else
                                var y = e.pageY;
                            var sliderY = $slider.offset().top + $slider.height();
                            var offsetY = sliderY - y;
                            var offsetPer = (offsetY / $slider.height()) * 100;
                        } else {
                            if (e.type == "touchmove")
                                var x = e.originalEvent.changedTouches[0].pageX;
                            else
                                var x = e.pageX;
                            var sliderX = $slider.offset().left;
                            var offsetX = x - sliderX;
                            var offsetPer = (offsetX / $slider.width()) * 100;
                        }
                        var range = self._settings.max - self._settings.min;
                        var offsetVal = offsetPer / 100 * range;
                        var val = toNearest(offsetVal + self._settings.min, self._settings.step);
                        val = Math.min(self._settings.max, Math.max(self._settings.min, val));
                        var lowerVal = toNearest(betterParseFloat(self._settings.value.split(',')[0]), self._settings.step);
                        if (lowerVal > val)
                            lowerVal = val;
                        self.value = lowerVal + "," + val;
                    };


                    function dragStopHandler2(e) {
                        $(window).off("mousemove touchmove", dragHandler2);
                        activeTimer2 = setTimeout(function () {
                            $handle2.removeClass("addui-slider-handle-active");
                        }, self._settings.timeout);
                    };
                    $handle2.on("mousedown touchstart", function (e) {
                        clearTimeout(activeTimer2);
                        $handle2.addClass("addui-slider-handle-active");
                        $(window).on("mousemove touchmove dragmove", dragHandler2);
                        $(window).one("mouseup touchend", dragStopHandler2);
                    });
                }
                return $slider;
            };

            this.init = function (settings) {
                var self = this;
                this.settings = settings;

                if (!this._settings.range) {
                    this._settings.value = Math.max(this._settings.min, Math.min(this._settings.max, betterParseFloat(this._settings.value)));
                } else {
                    var val = this._settings.value + "";
                    if (val.indexOf(",") > -1) { // Already has two values
                        var values = val.split(",");
                        var v1 = betterParseFloat(values[0]);
                        v1 = Math.min(this._settings.max, Math.max(this._settings.min, v1));
                        v1 = toNearest(v1, this._settings.step);

                        var v2 = betterParseFloat(values[1]);
                        v2 = Math.min(this._settings.max, Math.max(this._settings.min, v2));
                        v2 = toNearest(v2, this._settings.step);
                    } else { // Only has one value
                        var val = toNearest(Math.max(this._settings.min, Math.min(this._settings.max, betterParseFloat(this._settings.value))), this._settings.step);
                        var middle = (this._settings.max - this._settings.min) / 2;
                        if (val < middle) {
                            var v1 = val;
                            var v2 = this._settings.max - val;
                        } else {
                            var v2 = val;
                            var v1 = this._settings.min + val;
                        }
                    }
                    if (v1 < v2)
                        this._settings.value = v1 + "," + v2;
                    else
                        this._settings.value = v2 + "," + v1;
                }

                this.on("render", function () {
                    self.value = self._settings.value;
                })
                this.trigger("init", {
                    settings: this._settings
                });
            };
            this.init.apply(this, arguments);
        };

    }
);