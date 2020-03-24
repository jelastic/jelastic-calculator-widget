jQuery(document).ready(function ($) {

    class jCalculator {
        constructor(el) {
            this.calculatorElement = el;
        }
    }

        var calculatorTag = $('.j-calculator'),
            sHtml = '',
            sCurrentHoster = 'servint',
            bInitDefCor,
            fnSetDefault,
            fnInitDefaultHoster,
            oHosters = [],
            pricing = '',
            currency = '';

        // CLASSES
        const hSelectBlockClass = '.hoster-selector',
            hSelectClass = '.hoster-selector--select',
            calculatorBlockClass = '.calculator-wrapper',
            sCssLoading = 'loading';


        function getPricing() {
            $.ajax({
                type: "GET",
                url: 'http://platforms-info.jelastic.com/api/GetPricings',
                dataType: "json",
                success: function (pricingJSON) {
                    if (pricingJSON.result === 0) {
                        window.pricing = pricingJSON.response.pricings;
                        fnSetDefault();
                    }
                }
            });
        }

        function getCurrency() {
            $.ajax({
                type: "GET",
                url: 'http://platforms-info.jelastic.com/api/GetCurrency',
                dataType: "json",
                success: function (currencyJSON) {
                    if (currencyJSON.result === 0) {
                        window.currency = currencyJSON.response.objects;
                    }
                }
            });
        }

        getCurrency();
        getPricing();

        $(calculatorTag).addClass(sCssLoading);

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
                    $(el).attr('data-currency', oHoster.currencyCode);
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
            });

            if ($(el).find(calculatorBlockClass).length > 0) {
                $(el).find(calculatorBlockClass).replaceWith(sHtml);
            } else {
                $(el).append(sHtml);
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
                    setMinValues(ui.values[0], range);
                    setMaxValues(ui.values[1], range);
                    minPrice = checkPrice(ui.values[0], fixed.tiers);
                    // checkPrice(ui.values[1], dynamic.tiers);
                },
                slide: function (event, ui) {
                    setMinValues(ui.values[0], range);
                    setMaxValues(ui.values[1], range);
                    console.log(checkPrice(ui.values[0], fixed.tiers));
                    // checkPrice(ui.values[1], dynamic.tiers);
                }
            });

            console.log(fixed.tiers);

            minPrice = checkPrice(range.slider("values", 0), fixed.tiers);
            maxPrice = checkPrice(range.slider("values", 1), dynamic.tiers);

            setMinValues(range.slider("values", 0), range, fixed.tiers, usdRate);
            setMaxValues(range.slider("values", 1), range, dynamic.tiers, usdRate);


            // $(el).on('click', '.min-block-decrease', function (e) {
            //     range.slider('values', [(range.slider("values", 0) - 1), range.slider("values", 1)]);
            // });
            // $(el).on('click', '.max-block-decrease', function (e) {
            //     if ((range.slider("values", 0)) < range.slider("values", 1)) {
            //         range.slider('values', [(range.slider("values", 0)), range.slider("values", 1) - 1]);
            //     }
            // });
            // $(el).on('click', '.min-block-increase', function (e) {
            //     if ((range.slider("values", 0) + 1) <= range.slider("values", 1)) {
            //         range.slider('values', [(range.slider("values", 0) + 1), range.slider("values", 1)]);
            //     }
            // });
            // $(el).on('click', '.max-block-increase', function (e) {
            //     range.slider('values', [(range.slider("values", 0)), range.slider("values", 1) + 1]);
            // });
            // $(el).on('click', '.plus', function (e) {
            //     var digit = $(this).closest('.inner').find('.digit');
            //     digit.text(parseInt(digit.text()) + 1);
            // });
            // $(el).on('click', '.minus', function (e) {
            //     var digit = $(this).closest('.inner').find('.digit');
            //     if (parseInt(digit.text()) > 0) {
            //         digit.text(parseInt(digit.text()) - 1);
            //     }
            // });


            $(calculatorTag).removeClass(sCssLoading);


        }

        function convertMib(value) {
            value *= 128;
            return value > 1000 ? parseFloat(value / 1000).toFixed(2) + " GiB" : value + " MiB";
        }

        function convertMhz(value) {
            value *= 400;
            return value > 1000 ? parseFloat(value / 1000).toFixed(2) + " MHz" : value + " GHz";
        }

        function changePricePeriod(sPeriod, sValue) {
            switch (sPeriod) {
                case 'hourly':
                    sValue = sValue * 730;
                    break;

                case 'monthly':
                    sValue = (sValue * 1000) / 1000;
                    break
            }
            return sValue;
        }

        function checkPrice(value, tiers) {
            var price = tiers[0].price;
            for (var i = 0; i < tiers.length; i++) {
                if (!tiers[i + 1]) {
                    price = tiers[tiers.length - 1].price;
                } else {
                    if ((value >= tiers[i].value) && (value < tiers[i + 1].value)) {
                        price = tiers[i].price;
                        return price;
                    }
                }
            }
            return price;
        }

        function setMinValues(value, el) {

            // render line from dot to range
            var leftRange = $(el).closest(calculatorTag).find('.ui-slider-handle:first-of-type');
            var distance = leftRange.offset().left - $('.reserved .dot').offset().left + $('.reserved .dot').outerWidth() + 10;
            if (distance > 0) {
                $('.reserved .dot').html('<span class="line more" style="width:' + distance + 'px"></span>');
            } else {
                $('.reserved .dot').html('<span class="line less" style="width:' + Math.abs(distance) + 'px"></span>');
            }

            // change reserved cloudlets
            var mib = convertMib(value);
            var mhz = convertMhz(value);
            $(el).closest(calculatorTag).find('.min-block .digits').html('<span>' + mib + '</span><span>' + mhz + '</span>')

        }

        function setMaxValues(value, el) {

            // render line from dot to range
            var rightRange = $(el).closest(calculatorTag).find('.ui-slider-handle:last-of-type');
            var distance = rightRange.offset().left - $('.sl .dot').offset().left + $('.sl .dot').outerWidth() + 10;
            if (distance > 0) {
                $('.sl .dot').html('<span class="line more" style="width:' + distance + 'px"></span>');
            } else {
                $('.sl .dot').html('<span class="line less" style="width:' + Math.abs(distance) + 'px"></span>');
            }

            // change scaling limits
            var mib = convertMib(value);
            var mhz = convertMhz(value);
            $(el).closest(calculatorTag).find('.max-block .digits').html('<span>' + mib + '</span><span>' + mhz + '</span>')

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
            JApp.loadHosters(function (hosters) {
                oHosters = hosters;
                if (calculatorTag.length > 0) {
                    $.each(calculatorTag, function (e) {
                        renderHosterSelector($(this));
                        renderCalculator($(this));
                    });
                }
            });
        };

        $(document).on('change', hSelectClass, function (e) {
            var calculatorElement = $(this).closest(calculatorTag);
            sCurrentHoster = $(this).val();
            renderHosterSelector(calculatorElement);
            renderCalculator(calculatorElement);
        });

    }
);