var calculatorTag = $('.j-calculator'),
    sHtml = '',
    sCurrentHoster = 'servnet',
    bInitDefCor,
    fnSetDefault,
    fnInitDefaultHoster,
    oHosters = [],
    pricing = {},
    currency = '',
    calculatorsWithSelector = [],
    sCssLoading = 'loading';


function changeMode(value, el) {
    $(el).attr('data-mode', value);
}

function setReservedCloudlets(cloudlets, el, type) {
    $(el).attr('data-' + type + '-reserved', cloudlets);
    setMinValues(el, type);
}

function setScalingCloudlets(cloudlets, el, type) {
    if (cloudlets === 0) {
        $(el).find('label[for*=' + type + ']').removeClass('active');
        $(el).find('label[for*=' + type + '] .node-count input').val(0).change();
    } else {
        if (!$(el).find('label[for*=' + type + ']').hasClass('active')) {
            $(el).find('label[for*=' + type + '] .node-count input').val(1).change();
        }
        $(el).find('label[for*=' + type + ']').addClass('active');
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
    return value > 1000 ? parseFloat(value / 1024).toFixed(2) + " GiB" : value + " MiB";
}

function convertMhz(value) {
    value *= 400;
    return value > 1000 ? parseFloat(value / 1000).toFixed(2) + " GHz" : value + " MHz";
}

function changePricePeriod(sValue, sPeriod) {
    switch (sPeriod) {
        case 'hourly':
            sValue = Math.round(sValue * 100000) / 100000;
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
                return (sValue - tiers[tiers.length - 1].free) * tiers[tiers.length - 1].price;
            }
        } else {
            if ((sValue >= tiers[i].value) && (sValue < tiers[i + 1].value)) {
                if ((tiers[i].free > 0) && (sValue <= tiers[i].free)) {
                    return 0;
                } else {
                    price = tiers[i].price;
                    return (sValue - tiers[i].free) * price;
                }
            }
        }
    }

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

function checkTrafficPrice(sValue, tiers) {

    sValue = parseInt(sValue);
    var different = 0;

    if (sValue < tiers[0].value) {
        return 0;
    }

    for (var i = 0; i < tiers.length; i++) {
        different = sValue - tiers[i].value;

        if (!tiers[i + 1]) {
            if (tiers[tiers.length - 1].free > 0) {

                var val = sValue - tiers[tiers.length - 1].free;
                if (val < 0) {
                    val = 0;
                }
                return val * tiers[tiers.length - 1].price;

            } else {
                return tiers[tiers.length - 1].price * sValue;
            }
        } else {
            if ((sValue >= tiers[i].value) && (sValue < tiers[i + 1].value)) {
                if (tiers[i].free > 0) {

                    var val = sValue - tiers[i].free;

                    if (val < 0) {
                        val = 0;
                    }

                    return val * tiers[i].price;

                } else {
                    return sValue * tiers[i].price;
                }
            }
        }
    }
}

function setPrice(reservedTiers, scalingTiers, el, storageTiers, ipTiers, trafficTiers) {

    var currentCurrency = '',
        originalCurrency = '',
        currency = $(el).find('.current-switcher').val();

    $.each(window.currency, function (index) {
        if (currency === this.code) {
            currentCurrency = this;
        }
        if ($(el).attr('data-currency') === this.code) {
            originalCurrency = this;
        }
    });


    var balancerNodes = $(el).attr('data-balancer-nodes'),
        appServerNodes = $(el).attr('data-appserver-nodes'),
        databaseNodes = $(el).attr('data-database-nodes'),
        minBalancerPrice = checkPrice(parseInt(getReservedCloudlets(el, 'balancer')) * parseInt(balancerNodes), reservedTiers),
        minAppserverPrice = checkPrice(parseInt(getReservedCloudlets(el, 'appserver')) * parseInt(appServerNodes), reservedTiers),
        minDatabasePrice = checkPrice(parseInt(getReservedCloudlets(el, 'database')) * parseInt(databaseNodes), reservedTiers),
        maxBalancerPrice = checkMaxPrice(parseInt(getScalingCloudlets(el, 'balancer')) * parseInt(balancerNodes), scalingTiers, parseInt(getReservedCloudlets(el, 'balancer')) * parseInt(balancerNodes), reservedTiers),
        maxAppserverPrice = checkMaxPrice(parseInt(getScalingCloudlets(el, 'appserver')) * parseInt(appServerNodes), scalingTiers, parseInt(getReservedCloudlets(el, 'appserver')) * parseInt(appServerNodes), reservedTiers),
        maxDatabasePrice = checkMaxPrice(parseInt(getScalingCloudlets(el, 'database')) * parseInt(databaseNodes), scalingTiers, parseInt(getReservedCloudlets(el, 'database')) * parseInt(databaseNodes), reservedTiers),
        storagePrice = checkStoragePrice($(el).attr('data-storage'), storageTiers),
        ipPrice = checkIpPrice($(el).attr('data-ip'), ipTiers),
        trafficPrice = checkTrafficPrice($(el).attr('data-traffic'), trafficTiers);

    // TRAFFIC
    trafficPrice = toCurrency(trafficPrice, originalCurrency.rate.USD, currentCurrency.rate.USD);
    if ($(el).attr('data-period') === 'hourly') {
        trafficPrice = trafficPrice / 730;
    }

    // MIN PRICE
    var minPrice = minBalancerPrice + minAppserverPrice + minDatabasePrice;
    minPrice = minPrice + storagePrice + ipPrice;
    minPrice = toCurrency(minPrice, originalCurrency.rate.USD, currentCurrency.rate.USD);
    minPrice = changePricePeriod(minPrice, $(el).attr('data-period'));
    minPrice = +minPrice + +trafficPrice;
    switch ($(el).attr('data-period')) {
        case 'hourly':
            minPrice = Math.round(minPrice * 1000) / 1000;
            break;
        case 'monthly':
            minPrice = (minPrice).toFixed(2);
            break
    }
    $(el).find('.start-price .price').html(minPrice);


    // MAX PRICE
    var maxPrice = maxBalancerPrice + maxAppserverPrice + maxDatabasePrice;
    maxPrice = maxPrice + storagePrice + ipPrice;
    maxPrice = toCurrency(maxPrice, originalCurrency.rate.USD, currentCurrency.rate.USD);
    maxPrice = changePricePeriod(maxPrice, $(el).attr('data-period'));
    maxPrice = +maxPrice + +trafficPrice;
    if (+maxPrice < +minPrice) {
        maxPrice = minPrice;
    }
    switch ($(el).attr('data-period')) {
        case 'hourly':
            maxPrice = Math.round(maxPrice * 1000) / 1000;
            break;
        case 'monthly':
            maxPrice = parseFloat(maxPrice).toFixed(2);
            break
    }
    $(el).find('.max-price .price').html(maxPrice);


    // RESERVED COUNTS
    var reservedBalancerCloudlets = parseInt(getReservedCloudlets(el, 'balancer')) * parseInt(balancerNodes),
        reservedAppServerCloudlets = parseInt(getReservedCloudlets(el, 'appserver')) * parseInt(appServerNodes),
        reservedDbCloudlets = parseInt(getReservedCloudlets(el, 'database')) * parseInt(databaseNodes),
        reservedCloudletsMib = convertMib(+reservedBalancerCloudlets + +reservedAppServerCloudlets + +reservedDbCloudlets),
        reservedCloudletsGHz = convertMhz(+reservedBalancerCloudlets + +reservedAppServerCloudlets + +reservedDbCloudlets);

    $(el).find('.reserved-totals .gibs').html(reservedCloudletsMib);
    $(el).find('.reserved-totals .ghz').html(reservedCloudletsGHz);
    $(el).find('.reserved-totals .balancer').html(reservedBalancerCloudlets);
    $(el).find('.reserved-totals .appserver').html(reservedAppServerCloudlets);
    $(el).find('.reserved-totals .database').html(reservedDbCloudlets);
    $(el).find('.reserved-totals .cloudlets-total').html(+reservedBalancerCloudlets + +reservedAppServerCloudlets + +reservedDbCloudlets);

    var charsLength = reservedBalancerCloudlets + '' + reservedAppServerCloudlets + '' + reservedDbCloudlets;
    if (charsLength.length >= 8) {
        $(el).find('.calculator-right').addClass('new-row');
    } else {
        $(el).find('.calculator-right').removeClass('new-row');
    }

    // SCALING COUNTS
    var scalingBalancerCloudlets = parseInt(getScalingCloudlets(el, 'balancer')) * parseInt(balancerNodes),
        scalingAppServerCloudlets = parseInt(getScalingCloudlets(el, 'appserver')) * parseInt(appServerNodes),
        scalingDbCloudlets = parseInt(getScalingCloudlets(el, 'database')) * parseInt(databaseNodes),
        scalingCloudletsMib = convertMib(+scalingBalancerCloudlets + +scalingAppServerCloudlets + +scalingDbCloudlets),
        scalingCloudletsGHz = convertMhz(+scalingBalancerCloudlets + +scalingAppServerCloudlets + +scalingDbCloudlets);

    $(el).find('.scaling-totals .gibs').html(scalingCloudletsMib);
    $(el).find('.scaling-totals .ghz').html(scalingCloudletsGHz);
    $(el).find('.scaling-totals .balancer').html(scalingBalancerCloudlets);
    $(el).find('.scaling-totals .appserver').html(scalingAppServerCloudlets);
    $(el).find('.scaling-totals .database').html(scalingDbCloudlets);
    $(el).find('.scaling-totals .cloudlets-total').html(+scalingBalancerCloudlets + +scalingAppServerCloudlets + +scalingDbCloudlets);

    charsLength = scalingBalancerCloudlets + '' + scalingAppServerCloudlets + '' + scalingDbCloudlets;
    if (!$(el).find('.calculator-right').hasClass('new-row')) {
        if (charsLength.length >= 8) {
            $(el).find('.calculator-right').addClass('new-row');
        } else {
            $(el).find('.calculator-right').removeClass('new-row');
        }
    }


}

function checkPrice(cloudlets, tiers) {

    if (cloudlets < 1) {
        return 0;
    }

    for (var i = 0; i < tiers.length; i++) {
        var freeCloudlets = 0;
        if (i !== tiers.length - 1) {
            if ((cloudlets >= tiers[i].value) && (cloudlets < tiers[i + 1].value)) {
                freeCloudlets = cloudlets - tiers[i].value;
                if (freeCloudlets <= tiers[i].free) {
                    return tiers[i].price * tiers[i].value;
                } else {
                    return cloudlets * tiers[i].price;
                }
            }
        } else {
            freeCloudlets = cloudlets - tiers[tiers.length - 1].value;
            if (freeCloudlets <= tiers[tiers.length - 1].free) {
                return tiers[tiers.length - 1].price * tiers[tiers.length - 1].value;
            } else {
                return tiers[tiers.length - 1].price * cloudlets;
            }
        }
    }
}

function checkMaxPrice(cloudlets, tiers, minCloudlets, minTiers) {

    if (cloudlets === 0) {
        return 0;
    }

    var reservedPrice = checkPrice(minCloudlets, minTiers),
        scalingCloudlets = cloudlets - minCloudlets;

    for (var i = 0; i < tiers.length; i++) {
        if (i !== tiers.length - 1) {
            if ((cloudlets >= tiers[i].value) && (cloudlets < tiers[i + 1].value)) {
                if (scalingCloudlets <= tiers[i].free) {
                    return reservedPrice;
                } else {
                    return (scalingCloudlets * tiers[i].price) + reservedPrice;
                }
            }
        } else {
            if (scalingCloudlets <= tiers[tiers.length - 1].free) {
                return reservedPrice;
            } else {
                return (tiers[tiers.length - 1].price * scalingCloudlets) + reservedPrice;
            }
        }
    }
}

function toCurrency(nValue, sFrom, sTo) {
    return (sFrom / sTo) * nValue;
}

function setMinValues(el, type) {


    var value = getReservedCloudlets(el, type);

    // render line from dot to range
    var leftRange = $(el).find('.' + type + '-range .addui-slider-handle').eq(0),
        leftDot = $(el).find('.' + type + '-range .reserved .dot');
    var distance = leftRange.offset().left - $(leftDot).offset().left + $(leftDot).outerWidth() + 10;
    if (distance > 0) {
        $(leftDot).html('<span class="line more" style="width:' + (distance + 2) + 'px"></span>');
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

function increseNode(clickedElement) {
    var digit = $(clickedElement).closest('.node-count').find('input');
    digit.val(parseInt(digit.val()) + 1).change();
}

function decreaseNode(clickedElement) {
    var digit = $(clickedElement).closest('.node-count').find('input');
    if (parseInt(digit.val()) > 0) {
        digit.val(parseInt(digit.val()) - 1).change();
    }
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

function renderCalculator(el) {

    var oLanguages = $(el).data('languages') || ['java', 'php', 'node', 'python', 'go', 'ruby'],
        fixed = '',
        dynamic = '',
        ip = '',
        network = '',
        storage = '',
        period = $(el).attr('data-period') || 'hourly',
        startCurrency = $(el).attr('data-start-currency') || 'USD';

    if (!Array.isArray(oLanguages)) {
        oLanguages = oLanguages.split(",").map(function (item) {
            return item.trim();
        });
    }


    window.currency.sort(function (a, b) {
        var nameA = a.code.toLowerCase(),
            nameB = b.code.toLowerCase();
        if (nameA < nameB)
            return -1;
        if (nameA > nameB)
            return 1;
        return 0;
    });

    $.each(window.currency, function (index) {
        if (this.code === 'USD' || this.code === 'EUR') {
            window.currency.splice(0, 0, window.currency.splice(index, 1)[0]);
        }
    });

    sHtml = new EJS({url: '/j-calculator/templates/j-calculator'}).render({
        oLanguages: oLanguages,
        id: Math.round(Math.random() * 100000000),
        currencies: window.currency,
        startCurrency: startCurrency,

        balancerNodes: parseInt($(el).attr('data-balancer-nodes')) || 1,
        balancerMin: parseInt($(el).attr('data-balancer-min')) || 0,
        balancerMax: parseInt($(el).attr('data-balancer-max')) || 128,

        balancerReserved: parseInt($(el).attr('data-balancer-reserved')) || 0,
        balancerScaling: parseInt($(el).attr('data-balancer-scaling')) || 0,

        appServerNodes: parseInt($(el).attr('data-appserver-nodes')) || 1,
        appServerMin: parseInt($(el).attr('data-appserver-min')) || 0,
        appServerMax: parseInt($(el).attr('data-appserver-max')) || 128,

        appServerReserved: parseInt($(el).attr('data-appserver-reserved')) || 1,
        appServerScaling: parseInt($(el).attr('data-appserver-scaling')) || 64,

        databaseNodes: parseInt($(el).attr('data-database-nodes')) || 1,
        databaseMin: parseInt($(el).attr('data-database-min')) || 0,
        databaseMax: parseInt($(el).attr('data-database-max')) || 128,

        databaseReserved: parseInt($(el).attr('data-database-reserved')) || 0,
        databaseScaling: parseInt($(el).attr('data-database-scaling')) || 0,
    });

    if ($(el).find('.calculator-wrapper').length > 0) {
        $(el).find('.calculator-wrapper').replaceWith(sHtml);
    } else {
        $(el).append(sHtml);
    }

    $(el).attr('data-mode', 'appserver');

    $(el).attr('data-period', period);
    $(el).find('input[value=' + period + ']').attr('checked', 'checked').change();


    var sKey = pricing[$(el).attr('data-key')],
        tariffPlans = sKey.tariffPlans;

    for (var i = 0, oHoster; oHoster = oHosters[i]; i++) {
        if ($(el).attr('data-key') === oHoster.key) {
            $(el).attr('data-currency', oHoster.currencyCode);
        }
    }

    if (tariffPlans.length > 0) {
        $.each(tariffPlans, function () {

            if (this.type.toLowerCase() === 'fixed') {
                fixed = this;
            }
            if (this.type.toLowerCase() === 'flexible') {
                dynamic = this;
            }
            if (this.type.toLowerCase() === 'network') {
                network = this;
            }
            if (this.type.toLowerCase() === 'storage') {
                storage = this;
            }
            if (this.keyword.toLowerCase() === 'ip') {
                ip = this;
            }
        });
    }


    $(el).find('.current-switcher').each(function () {

        var $this = $(this), numberOfOptions = $(this).children('option').length;

        $this.addClass('select-hidden');
        $this.wrap('<div class="select"></div>');
        $this.after('<div class="select-styled"></div>');

        var $styledSelect = $this.next('div.select-styled');
        $styledSelect.html($this.children('option:selected').attr('data-sign') + ' - ' + $this.children('option:selected').html());

        var $list = $('<ul />', {
            'class': 'select-options'
        }).insertAfter($styledSelect);

        for (var i = 0; i < numberOfOptions; i++) {

            var classes = '';
            if ($this.children('option').eq(i).text() === $this.children('option:selected').text()) {
                classes = 'current-currency';
            }

            var li = $('<li />', {
                text: $this.children('option').eq(i).html(),
                rel: $this.children('option').eq(i).val(),
                class: classes
            }).appendTo($list);

            $('<span />', {
                class: 'currency-sign',
                text: $this.children('option').eq(i).attr('data-sign') + ' - '
            }).prependTo(li);

            $('<span />', {
                class: 'currency-name',
                text: $this.children('option').eq(i).attr('data-name')
            }).appendTo(li);

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
            $list.find('.current-currency').removeClass('current-currency');
            $(this).addClass('current-currency');
            e.stopPropagation();
            $styledSelect.html($(this).html()).removeClass('active');
            $this.val($(this).attr('rel')).change();
            $list.hide();
        });

        $(document).click(function () {
            $styledSelect.removeClass('active');
            $list.hide();
        });

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
        s.network = network;

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


    var defaultOptions = {
        "storage": 10,
        "ip": 1,
        "traffic": 10,
        "balancer-nodes": 0,
        "appserver-nodes": 1,
        "database-nodes": 0
    };

    $.each(defaultOptions, function (key, value) {
        var digit = el.querySelectorAll('[name=' + key + ']')[0];
        if (el.getAttribute('data-' + key)) {
            digit.value = el.getAttribute('data-' + key);
            if (+el.getAttribute('data-' + key) > +digit.getAttribute('max')) {
                el.setAttribute('data-' + key, digit.getAttribute('max'));
                digit.value = el.getAttribute('data-' + key);
            }
        } else {
            el.setAttribute('data-' + key, value);
            digit.value = el.getAttribute('data-' + key);
        }
    });


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
    $(el).find('.digit, .node-count input').change(function (e) {
        var digit = $(this),
            type = digit.attr('name');

        el.setAttribute('data-' + type, this.value);

        if (parseInt(digit.val()) > parseInt(digit.attr('max'))) {
            digit.val(digit.attr('max')).change();
        }

        if (parseInt(digit.val()) < 0 || digit.val() === '') {
            digit.val(0).change();
        }

        setPrice(fixed.tiers, dynamic.tiers, el, storage.tiers, ip.tiers, network.tiers);
    });
    $(el).find('.plus').click(function (e) {
        e.preventDefault();
        increaseBlockDigit(this);
    });
    $(el).find('.minus').click(function (e) {
        e.preventDefault();
        decreaseBlockDigit(this);
    });
    $(el).find('.plus-node').click(function (e) {
        e.preventDefault();
        increseNode(this);
    });
    $(el).find('.minus-node').click(function (e) {
        e.preventDefault();
        decreaseNode(this);
    });
    $(el).find('.calculator-right input').click(function (e) {
        $(el).attr('data-period', $(this).val());
        setPrice(fixed.tiers, dynamic.tiers, el, storage.tiers, ip.tiers, network.tiers);
    });
    $(el).find('.current-switcher').change(function (e) {
        setPrice(fixed.tiers, dynamic.tiers, el, storage.tiers, ip.tiers, network.tiers);
    });

    $(calculatorTag).removeClass(sCssLoading);

}

fnSetDefault = function () {
    var sHosterCriteria = JApp.utils.uniqid();
    if (JApp.isLoadedDefHoster()) {
        return fnInitDefaultHoster();
    } else {
        return JApp.loadDefaultHoster(fnInitDefaultHoster, sHosterCriteria);
    }
    bInitDefCor = false;
};
fnInitDefaultHoster = function (sHoster) {
    sCurrentHoster = sHoster || JApp.getDefaultHoster();
    getAllPrices(function () {
        JApp.loadHosters(function (hosters) {
            $.each(hosters, function (index) {
                if (this.keyword === 'servint') {
                    hosters.splice(index, 1);
                    return false;
                }
            });
            oHosters = hosters;
            $.each(calculatorsWithSelector, function () {
                renderHosterSelector($(this));
                renderCalculator(this);
            })
        });
    });
};


function getAllPrices(fnCallback) {
    $.ajax({
        type: "GET",
        url: '//platforms-info.jelastic.com/api/GetPricings',
        dataType: "json",
        success: function (pricingJSON) {
            if (pricingJSON.result === 0) {
                if (fnCallback) {
                    pricing = pricingJSON.response.pricings;
                    fnCallback();
                }
            } else {
                console.log('Error: can not get pricing models');
            }
        },
        error: function (response) {
            console.log(response);
        }
    });
}

function getHosterPrices(sKey, element) {
    $.ajax({
        type: "GET",
        url: 'https://' + sKey + '/auth/GetDefaultPricingModels',
        dataType: "json",
        success: function (hosterPricingJSON) {
            if (hosterPricingJSON.result === 0 && hosterPricingJSON.response.models[0]) {
                pricing[sKey] = hosterPricingJSON.response.models[0];
                $.ajax({
                    type: "GET",
                    url: 'https://' + sKey + '/settings/GetHosterSettings',
                    dataType: "json",
                    success: function (hosterSettingsJSON) {

                        if (hosterSettingsJSON.result === 0 && hosterSettingsJSON.response.settingsCurrencyCode) {

                            $(element).attr('data-currency', hosterSettingsJSON.response.settingsCurrencyCode);
                            renderCalculator(element);

                        } else {
                            console.log('Error: can not get hoster default currency');
                        }
                    },
                    error: function (response) {
                        console.log(response);
                    }
                });
            } else {
                console.log('Error: can not get hoster pricing model');
            }
        },
        error: function (response) {
            console.log(response);
        }
    });
}

jQuery(document).ready(function ($) {

    $(calculatorTag).addClass(sCssLoading);

    $.ajax({
        type: "GET",
        url: '//platforms-info.jelastic.com/api/GetCurrency',
        dataType: "json",
        success: function (currencyJSON) {
            if (currencyJSON.result === 0) {
                window.currency = currencyJSON.response.objects;
                
                console.log(currencyJSON.response.objects);

                if (calculatorTag.length > 0) {
                    $.each(calculatorTag, function (e) {
                        if ($(this).attr('data-key')) {
                            getHosterPrices($(this).attr('data-key'), this);
                        } else {
                            calculatorsWithSelector.push(this);
                        }
                    });

                    if (calculatorsWithSelector.length) {
                        fnSetDefault();
                    }

                }

            }
        },
        error: function (response) {
            console.log(response);
        }
    });
});

$(window).resize(function () {
    $('.j-calculator[data-mode]').each(function () {
        setMinValues(this, $(this).attr('data-mode'));
        setMaxValues(this, $(this).attr('data-mode'));
    });
});