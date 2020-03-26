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


            $(calculatorTag).removeClass(sCssLoading);
        }

        function renderCalculator(el) {

            var oLanguages = ['java', 'php', 'node', 'ruby', 'python', 'go'],
                fixed = '',
                dynamic = '',
                minPrice = '',
                maxPrice = '',
                usdRate = 1;

            sHtml = new EJS({url: '/j-calculator/templates/calculator'}).render({
                calculatorBlockClass: calculatorBlockClass.replace('.', ''),
                oLanguages: oLanguages,
                id: Math.round(Math.random() * 100000000)
            });


            if ($(el).find(calculatorBlockClass).length > 0) {
                $(el).find(calculatorBlockClass).replaceWith(sHtml);
            } else {
                $(el).append(sHtml);
            }

            $(el).attr('data-period', 'hourly');
            for (var i = 0, oHoster; oHoster = oHosters[i]; i++) {
                if ($(el).attr('data-key') === oHoster.key) {
                    $(el).attr('data-currency', oHoster.currencyCode);
                }
            }

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
                });
            }
            $.each(window.currency, function () {
                if (this.code === hosterCurrency) {
                    usdRate = this.usdRate;
                }
            });

            var range = $(el).find('.range').slider({
                animate: "fast",
                range: true,
                min: fixed.minCloudletCount,
                max: 128,
                values: [1, 120],
                change: function (event, ui) {

                    setReservedCloudlets(ui.values[0], el);
                    setScalingCloudlets(ui.values[1], el);

                    setMinPrice(fixed.tiers, el, usdRate);
                    setMaxPrice(dynamic.tiers, fixed.tiers, el, usdRate);

                },
                slide: function (event, ui) {

                    setReservedCloudlets(ui.values[0], el);
                    setScalingCloudlets(ui.values[1], el);

                    setMinPrice(fixed.tiers, el, usdRate);
                    setMaxPrice(dynamic.tiers, fixed.tiers, el, usdRate);

                }
            });

            setReservedCloudlets(range.slider("values", 0), el);
            setScalingCloudlets(range.slider("values", 1), el);

            setMinPrice(fixed.tiers, el, usdRate);
            setMaxPrice(dynamic.tiers, fixed.tiers, el, usdRate);

            $(el).find('.min-block-decrease').click(function (e) {
                e.preventDefault();
                decreaseReserved(el);
            });
            $(el).find('.min-block-increase').click(function (e) {
                e.preventDefault();
                increaseReserved(el);
            });
            $(el).find('.max-block-decrease').click(function (e) {
                e.preventDefault();
                decreaseScaling(el);
            });
            $(el).find('.max-block-increase').click(function (e) {
                e.preventDefault();
                increaseScaling(el);
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
                setMinPrice(fixed.tiers, el, usdRate);
                setMaxPrice(dynamic.tiers, fixed.tiers, el, usdRate);
            });


            $(calculatorTag).removeClass(sCssLoading);

        }

        function decreaseReserved(el) {
            $(el).find('.range').slider('values', [getReservedCloudlets(el) - 1, getScalingCloudlets(el)]);
        }

        function increaseReserved(el) {
            if ((getReservedCloudlets(el) + 1) <= getScalingCloudlets(el)) {
                $(el).find('.range').slider('values', [getReservedCloudlets(el) + 1, getScalingCloudlets(el)]);
            }
        }

        function decreaseScaling(el) {
            if (getReservedCloudlets(el) < getScalingCloudlets(el)) {
                $(el).find('.range').slider('values', [getReservedCloudlets(el), getScalingCloudlets(el) - 1]);
            }
        }

        function increaseScaling(el) {
            $(el).find('.range').slider('values', [getReservedCloudlets(el), getScalingCloudlets(el) + 1]);
        }

        function increaseBlockDigit(clickedElement) {
            var digit = $(clickedElement).closest('.inner').find('.digit');
            digit.text(parseInt(digit.text()) + 1);
        }

        function decreaseBlockDigit(clickedElement) {
            var digit = $(clickedElement).closest('.inner').find('.digit');
            if (parseInt(digit.text()) > 0) {
                digit.text(parseInt(digit.text()) - 1);
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
           $('.j-calculator[data-reserved]').each(function () {
               setMinValues(this);
               setMaxValues(this);
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

        function setReservedCloudlets(cloudlets, el) {
            $(el).attr('data-reserved', cloudlets);
            setMinValues(el);
        }

        function setScalingCloudlets(cloudlets, el) {
            $(el).attr('data-scaling', cloudlets);
            setMaxValues(el);
        }

        function getReservedCloudlets(el) {
            return parseInt($(el).attr('data-reserved'));
        }

        function getScalingCloudlets(el) {
            return parseInt($(el).attr('data-scaling'));
        }

        function convertMib(value) {
            value *= 128;
            return value > 1000 ? parseFloat(value / 1000).toFixed(2) + " GiB" : value + " MiB";
        }

        function convertMhz(value) {
            value *= 400;
            return value > 1000 ? parseFloat(value / 1000).toFixed(2) + " MHz" : value + " GHz";
        }

        function changePricePeriod(sValue, sPeriod) {
            switch (sPeriod) {
                case 'hourly':
                    sValue = Math.ceil(sValue * 1000000) / 1000000;
                    break;

                case 'monthly':
                    sValue = (sValue * 730).toFixed(2);
                    break
            }
            return sValue;
        }

        function setMinPrice(reservedTiers, el, usdRate) {
            var minPrice = checkPrice(getReservedCloudlets(el), reservedTiers);
            minPrice = toUSD(minPrice, usdRate);
            minPrice = changePricePeriod(minPrice, $(el).attr('data-period'));
            $(el).find('.start-price .price').html('$' + minPrice);
        }

        function setMaxPrice(scalingTiers, reservedTiers, el, usdRate) {
            var maxPrice = checkMaxPrice(getScalingCloudlets(el), scalingTiers, getReservedCloudlets(el), reservedTiers);
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
            var price = tiers[0].price;
            for (var i = 0; i < tiers.length; i++) {
                if (!tiers[i + 1]) {
                    price = tiers[tiers.length - 1].price;
                } else {
                    if ((cloudlets >= tiers[i].value) && (cloudlets < tiers[i + 1].value)) {
                        if (tiers[i].free > 0) {
                            var disatance = cloudlets - minCloudlets;
                            if (disatance <= tiers[i].free) {
                                return checkPrice(minCloudlets, minTiers);
                            } else {
                                price = tiers[i].price;
                                return cloudlets * price;
                            }
                        } else {
                            price = tiers[i].price;
                            return cloudlets * price;
                        }
                    }
                }
            }
            return cloudlets * price;
        }

        function toUSD(sValue, sUsdRate) {
            return sValue * sUsdRate;
        }

        function setMinValues(el) {

            var value = getReservedCloudlets(el);

            // render line from dot to range
            var leftRange = $(el).find('.ui-slider-handle:first-of-type'),
                leftDot = $(el).find('.reserved .dot');
            var distance = leftRange.offset().left - $(leftDot).offset().left + $(leftDot).outerWidth() + 10;
            if (distance > 0) {
                $(leftDot).html('<span class="line more" style="width:' + distance + 'px"></span>');
            } else {
                $(leftDot).html('<span class="line less" style="width:' + Math.abs(distance) + 'px"></span>');
            }

            // change reserved cloudlets
            var mib = convertMib(value);
            var mhz = convertMhz(value);
            $(el).find('.min-block .digits').html('<span>' + mib + '</span><span>' + mhz + '</span>')

        }

        function setMaxValues(el) {

            var value = getScalingCloudlets(el);

            // render line from dot to range
            var rightRange = $(el).find('.ui-slider-handle:last-of-type'),
                rightDot = $(el).find('.sl .dot');
            var distance = rightRange.offset().left - $(rightDot).offset().left + $(rightDot).outerWidth() + 10;
            if (distance > 0) {
                $(rightDot).html('<span class="line more" style="width:' + distance + 'px"></span>');
            } else {
                $(rightDot).html('<span class="line less" style="width:' + Math.abs(distance) + 'px"></span>');
            }

            // change scaling limits
            var mib = convertMib(value);
            var mhz = convertMhz(value);
            $(el).find('.max-block .digits').html('<span>' + mib + '</span><span>' + mhz + '</span>')
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

    }
);