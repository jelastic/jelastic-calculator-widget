JApp.pricing = JApp.pricing || {};

JApp.pricing.Calculator = function (config) {

    var self = this;

    self.loaded = false;
    self.sCurrentHoster = 'servnet';
    self.oHosters = [];
    self.pricing = {};
    self.currencies = '';
    self.element = config.oElement;
    self.sKey = config.sKey;
    self.hosterCurrency = 'USD';
    self.oLanguages = [];
    self.startCurrency = '';
    self.localization = {
        txChoose: 'Choose Service Provider of Jelastic Public Cloud',
        txPerfomance: 'Perfomance',
        txSupport: 'Support',
        txLocation: 'Location',
        txServices: 'Advanced Services',
        balancerTxt: self.element.getAttribute('data-balancer-tx') || 'Balancer',
        AppServerTxt: self.element.getAttribute('data-appserver-tx') || 'App Server',
        DatabaseTxt: self.element.getAttribute('data-db-tx') || 'Database',
        DiskTxt: self.element.getAttribute('data-disk-tx') || 'Disk Space<span class="small">GB / hour</span>',
        DiscTooltipTxt: self.element.getAttribute('data-disk-tooltip-tx') || 'Amount of disk space consumed per hour. While checking per month price, the calculator considers that you use the stated number of GB every hour during the whole period. The platform will count only consumed resources on hourly basis, so the total price can be lower.',
        IpTxt: self.element.getAttribute('data-ip-tx') || 'Public IP',
        TrafficTxt: self.element.getAttribute('data-traffic-tx') || 'External Traffic<span class="small">GB / hour</span>',
        TrafficTooltipTxt: self.element.getAttribute('data-traffic-tooltip-tx') || 'Amount of external traffic consumed per hour. While checking per month price, the calculator considers that you use the stated number of GB every hour during the whole period. The platform will count only consumed resources on hourly basis, so the total price can be lower.',
        ReservedTxt: self.element.getAttribute('data-reserved-tx') || 'Reserved',
        ReservedCloudletsTxt: self.element.getAttribute('data-reserved-cloudlets-tx') || 'Reserved Cloudlets',
        ReservedDescriptionTxt: self.element.getAttribute('data-reserved-tooltip-tx') || 'Reserve the cloudlets to pay a fixed price. The more you reserve, the bigger the discount is!',
        ScalingLimitTxt: self.element.getAttribute('data-scaling-limit-tx') || 'Scaling Limit',
        ScalingDescriptionTxt: self.element.getAttribute('data-scaling-tooltip-tx') || 'Define the maximum amount of resources for automatic vertical scaling based on load changes',
        totalTxt: self.element.getAttribute('data-total-tx') || 'Total Cloudlets',
        hourlyTxt: self.element.getAttribute('data-hourly-tx') || 'Per Hour',
        monthlyTxt: self.element.getAttribute('data-monthly-tx') || 'Per Month',
        priceMinTxt: self.element.getAttribute('data-price-min-tx') || 'Starting Price',
        priceMaxTxt: self.element.getAttribute('data-price-max-tx') || 'Maximum Price',
        priceMaxDescrTxt: self.element.getAttribute('data-price-max-descr-tx') || 'if all resources are fully used up to Scaling Limit',
        balancerMin: self.element.getAttribute('data-balancer-min') || 0,
        balancerMax: self.element.getAttribute('data-balancer-max') || 128,
        appServerMin: self.element.getAttribute('data-appserver-min') || 0,
        appServerMax: self.element.getAttribute('data-appserver-max') || 128,
        databaseMin: self.element.getAttribute('data-database-min') || 0,
        databaseMax: self.element.getAttribute('data-database-max') || 128,
    };
    self.loadedComponents = {
        pricing: false,
        currencies: false,
        hosters: false,
        defaultHoster: false
    };
    self.fixed = '';
    self.dynamic = '';
    self.ip = '';
    self.network = '';
    self.storage = '';
    self.period = '';
    self.cloudlets = {
        balancer: {
            reserved: self.element.getAttribute('data-balancer-reserved') || 0,
            scaling: self.element.getAttribute('data-balancer-scaling') || 0,
            nodes: self.element.getAttribute('data-balancer-nodes') || 1,
        },
        appserver: {
            reserved: self.element.getAttribute('data-appserver-reserved') || 1,
            scaling: self.element.getAttribute('data-appserver-scaling') || 64,
            nodes: self.element.getAttribute('data-appserver-nodes') || 1,
        },
        database: {
            reserved: self.element.getAttribute('data-database-reserved') || 0,
            scaling: self.element.getAttribute('data-database-scaling') || 0,
            nodes: self.element.getAttribute('data-database-nodes') || 1,
        },
        storage: self.element.getAttribute('data-storage') || 10,
        ip: self.element.getAttribute('data-ip') || 1,
        traffic: self.element.getAttribute('data-traffic') || 10,
    };

    self.setLoaded = function (sKey) {
        self.loadedComponents[sKey] = true;

        if (!self.sKey) {
            if (self.loadedComponents.currencies && self.loadedComponents.defaultHoster && self.loadedComponents.hosters && self.loadedComponents.pricing) {
                self.getAllData();
            }
        } else {
            if (self.loadedComponents.currencies && self.loadedComponents.defaultHoster && self.loadedComponents.pricing) {
                self.renderCalculator();
            }
        }
    };

    self.setReservedCloudlets = function (cloudlets, type) {
        self.cloudlets[type].reserved = cloudlets;
        self.setMinValues(type);
    };

    self.setScalingCloudlets = function (cloudlets, type) {
        if (cloudlets === 0) {
            $(self.element).find('label[for*=' + type + ']').removeClass('active');
            $(self.element).find('label[for*=' + type + '] .node-count input').val(0).change();
        } else {
            if (!$(self.element).find('label[for*=' + type + ']').hasClass('active')) {
                if (self.cloudlets[type].nodes === 0) {
                    $(self.element).find('label[for*=' + type + '] .node-count input').val(1).change();
                } else {
                    $(self.element).find('label[for*=' + type + '] .node-count input').val(self.cloudlets[type].nodes).change();
                }
            }
            $(self.element).find('label[for*=' + type + ']').addClass('active');
        }

        self.cloudlets[type].scaling = cloudlets;

        self.setMaxValues(type);
    };

    self.convertMib = function (value) {
        value *= 128;
        return value > 1000 ? parseFloat(value / 1024).toFixed(2) + " GiB" : value + " MiB";
    };

    self.convertMhz = function (value) {
        value *= 400;
        return value > 1000 ? parseFloat(value / 1000).toFixed(2) + " GHz" : value + " MHz";
    };

    self.changePricePeriod = function (sValue) {

        switch (self.period) {
            case 'hourly':
                sValue = Math.round(sValue * 1000) / 1000;
                break;

            case 'monthly':
                sValue = (sValue * 730).toFixed(2);
                break
        }

        return sValue;
    };

    self.checkStoragePrice = function () {
        sValue = self.cloudlets.storage;
        var tiers = self.storage.tiers;
        price = tiers[0].price;

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
    };

    self.checkIpPrice = function () {
        sValue = self.cloudlets.ip;
        var tiers = self.ip.tiers,
            price = tiers[0].price;

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
    };

    self.checkTrafficPrice = function () {

        sValue = self.cloudlets.traffic;
        var tiers = self.network.tiers;
        different = 0;

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
    };

    self.setPrice = function () {

        var currentCurrency = '',
            originalCurrency = '',
            currency = $(self.element).find('.current-switcher').val();

        $.each(self.currencies, function (index) {
            if (currency === this.code) {
                currentCurrency = this.rate.USD;
            }
            if (self.hosterCurrency === this.code) {
                originalCurrency = this.rate.USD;
            }
        });

        var minBalancerPrice = self.checkPrice('balancer'),
            minAppserverPrice = self.checkPrice('appserver'),
            minDatabasePrice = self.checkPrice('database'),

            maxBalancerPrice = self.checkMaxPrice('balancer'),
            maxAppserverPrice = self.checkMaxPrice('appserver'),
            maxDatabasePrice = self.checkMaxPrice('database'),

            storagePrice = self.checkStoragePrice(),
            ipPrice = self.checkIpPrice(),
            trafficPrice = self.checkTrafficPrice();


        // MIN PRICE
        var minPrice = minBalancerPrice + minAppserverPrice + minDatabasePrice;


        minPrice = minPrice + storagePrice + ipPrice + trafficPrice;

        minPrice = self.toCurrency(minPrice, originalCurrency, currentCurrency);

        minPrice = self.changePricePeriod(minPrice);

        $(self.element).find('.start-price .price').html(minPrice);

        // MAX PRICE
        var maxPrice = maxBalancerPrice + maxAppserverPrice + maxDatabasePrice;
        maxPrice = maxPrice + storagePrice + ipPrice + trafficPrice;
        maxPrice = self.toCurrency(maxPrice, originalCurrency, currentCurrency);
        maxPrice = self.changePricePeriod(maxPrice);
        if (+maxPrice < +minPrice) {
            maxPrice = minPrice;
        }
        $(self.element).find('.max-price .price').html(maxPrice);


        // RESERVED COUNTS
        var reservedBalancerCloudlets = self.cloudlets.balancer.reserved * self.cloudlets.balancer.nodes,
            reservedAppServerCloudlets = self.cloudlets.appserver.reserved * self.cloudlets.appserver.nodes,
            reservedDbCloudlets = self.cloudlets.database.reserved * self.cloudlets.database.nodes,
            reservedCloudletsMib = self.convertMib(+reservedBalancerCloudlets + +reservedAppServerCloudlets + +reservedDbCloudlets),
            reservedCloudletsGHz = self.convertMhz(+reservedBalancerCloudlets + +reservedAppServerCloudlets + +reservedDbCloudlets);

        $(self.element).find('.reserved-totals .gibs').html(reservedCloudletsMib);
        $(self.element).find('.reserved-totals .ghz').html(reservedCloudletsGHz);
        $(self.element).find('.reserved-totals .balancer').html(reservedBalancerCloudlets);
        $(self.element).find('.reserved-totals .appserver').html(reservedAppServerCloudlets);
        $(self.element).find('.reserved-totals .database').html(reservedDbCloudlets);
        $(self.element).find('.reserved-totals .cloudlets-total').html(+reservedBalancerCloudlets + +reservedAppServerCloudlets + +reservedDbCloudlets);

        var charsLength = reservedBalancerCloudlets + '' + reservedAppServerCloudlets + '' + reservedDbCloudlets;
        if (charsLength.length >= 8) {
            $(self.element).find('.calculator-right').addClass('new-row');
        } else {
            $(self.element).find('.calculator-right').removeClass('new-row');
        }

        // SCALING COUNTS
        var scalingBalancerCloudlets = self.cloudlets.balancer.scaling * self.cloudlets.balancer.nodes,
            scalingAppServerCloudlets = self.cloudlets.appserver.scaling * self.cloudlets.appserver.nodes,
            scalingDbCloudlets = self.cloudlets.database.scaling * self.cloudlets.database.nodes,
            scalingCloudletsMib = self.convertMib(+scalingBalancerCloudlets + +scalingAppServerCloudlets + +scalingDbCloudlets),
            scalingCloudletsGHz = self.convertMhz(+scalingBalancerCloudlets + +scalingAppServerCloudlets + +scalingDbCloudlets);

        $(self.element).find('.scaling-totals .gibs').html(scalingCloudletsMib);
        $(self.element).find('.scaling-totals .ghz').html(scalingCloudletsGHz);
        $(self.element).find('.scaling-totals .balancer').html(scalingBalancerCloudlets);
        $(self.element).find('.scaling-totals .appserver').html(scalingAppServerCloudlets);
        $(self.element).find('.scaling-totals .database').html(scalingDbCloudlets);
        $(self.element).find('.scaling-totals .cloudlets-total').html(+scalingBalancerCloudlets + +scalingAppServerCloudlets + +scalingDbCloudlets);

        charsLength = scalingBalancerCloudlets + '' + scalingAppServerCloudlets + '' + scalingDbCloudlets;
        if (!$(self.element).find('.calculator-right').hasClass('new-row')) {
            if (charsLength.length >= 8) {
                $(self.element).find('.calculator-right').addClass('new-row');
            } else {
                $(self.element).find('.calculator-right').removeClass('new-row');
            }
        }
    };

    self.checkPrice = function (type) {

        var cloudlets = self.cloudlets[type].reserved * self.cloudlets[type].nodes,
            tiers = self.fixed.tiers;

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
    };

    self.checkMaxPrice = function (type) {

        var cloudlets = self.cloudlets[type].scaling * self.cloudlets[type].nodes,
            minCloudlets = self.cloudlets[type].reserved * self.cloudlets[type].nodes,
            tiers = self.dynamic.tiers;

        if (cloudlets === 0) {
            return 0;
        }

        var reservedPrice = this.checkPrice(type),
            scalingCloudlets = cloudlets - minCloudlets;

        for (var i = 0; i < tiers.length; i++) {
            if (i !== tiers.length - 1) {
                if ((scalingCloudlets >= tiers[i].value) && (scalingCloudlets < tiers[i + 1].value)) {
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
    };

    self.toCurrency = function (nValue, sFrom, sTo) {
        return (sFrom / sTo) * nValue;
    };

    self.setMinValues = function (type) {

        var value = self.cloudlets[type].reserved;

        // render line from dot to range
        var leftRange = $(self.element).find('.' + type + '-range .addui-slider-handle').eq(0),
            leftDot = $(self.element).find('.' + type + '-range .reserved .dot');
        var distance = leftRange.offset().left - $(leftDot).offset().left + $(leftDot).outerWidth() + 10;
        if (distance > 0) {
            $(leftDot).html('<span class="line more" style="width:' + (distance + 2) + 'px"></span>');
        } else {
            $(leftDot).html('<span class="line less" style="width:' + Math.abs(distance) + 'px"></span>');
        }

        // change reserved cloudlets
        var mib = self.convertMib(value);
        var mhz = self.convertMhz(value);
        $(self.element).find('.' + type + '-range .min-block .digits').html('<span>' + mib + '</span><span>' + mhz + '</span>')

    };

    self.setMaxValues = function (type) {

        var value = self.cloudlets[type].scaling;

        // render line from dot to range
        var rightRange = $(self.element).find('.' + type + '-range .addui-slider-handle').eq(1),
            rightDot = $(self.element).find('.' + type + '-range .sl .dot');
        var distance = rightRange.offset().left - $(rightDot).offset().left + $(rightDot).outerWidth() + 10;
        if (distance > 0) {
            $(rightDot).html('<span class="line more" style="width:' + (distance + 2) + 'px"></span>');
        } else {
            $(rightDot).html('<span class="line less" style="width:' + Math.abs(distance) + 'px"></span>');
        }

        // change scaling limits
        var mib = self.convertMib(value);
        var mhz = self.convertMhz(value);
        $(self.element).find('.' + type + '-range .max-block .digits').html('<span>' + mib + '</span><span>' + mhz + '</span>')
    };

    self.decreaseReserved = function (oSlider) {
        var l = oSlider.value.split(',')[0];
        var r = oSlider.value.split(',')[1];
        if (l > oSlider._settings.min) {
            l--;
            oSlider.value = '' + l + ',' + r + '';
        }
    };

    self.increaseReserved = function (oSlider) {
        var l = oSlider.value.split(',')[0];
        var r = oSlider.value.split(',')[1];
        if (l < oSlider._settings.max) {
            if (l === r) {
                r++;
            }
            l++;
            oSlider.value = '' + l + ',' + r + '';
        }
    };

    self.decreaseScaling = function (oSlider) {
        var l = oSlider.value.split(',')[0];
        var r = oSlider.value.split(',')[1];
        if (r > oSlider._settings.min) {
            if (l === r) {
                l--;
            }
            r--;

            oSlider.value = '' + l + ',' + r + '';
        }
    };

    self.increaseScaling = function (oSlider) {
        var l = oSlider.value.split(',')[0];
        var r = oSlider.value.split(',')[1];
        if (r < oSlider._settings.max) {
            r++;
            oSlider.value = '' + l + ',' + r + '';
        }
    };

    self.Slider = function (el, settings) {

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

        s.storage = self.storage;
        s.ip = self.ip;

        s.fixed = self.fixed;
        s.dynamic = self.dynamic;
        s.network = self.network;

        s.calculator = self;

        settings = $.extend(s, $el.data(), settings);

        var S = new $add.SliderObj(settings);
        S.render($el, "replace");
        return S;
    };

    self.onlyUnique = function (value, index, self) {
        return self.indexOf(value) === index;
    };

    self.renderHosterSelector = function () {

        self.loaded = false;

        sHtml = new EJS({url: '/j-calculator/templates/j-hoster-selector'}).render({
            localization: self.localization,
            defHoster: self.sCurrentHoster,
            hosters: self.oHosters
        });

        for (var i = 0, oHoster; oHoster = self.oHosters[i]; i++) {
            if (self.sCurrentHoster === oHoster.keyword) {
                self.sKey = oHoster.key;
                self.sCurrentHoster = oHoster.keyword;
                $(self.element).attr('data-custom-signup', oHoster.customSignUp);
            }
        }

        if ($(self.element).find('.hoster-selector').length > 0) {
            $(self.element).find('.hoster-selector').replaceWith(sHtml);
        } else {
            $(self.element).append(sHtml);
        }
        $(self.element).find('.hoster-selector--select').each(function () {
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
                var classes = '';
                if ($this.children('option').eq(i).text() === $this.children('option:selected').text()) {
                    classes = 'current-hoster';
                }
                var li = $('<li />', {
                    text: $this.children('option').eq(i).text(),
                    rel: $this.children('option').eq(i).val(),
                    class: classes
                }).appendTo($list);
                var li_flags = $('<span />', {
                    class: 'flags',
                }).appendTo(li);
                var loc = $this.children('option').eq(i).attr('data-location').split(',').filter(self.onlyUnique);
                $.each(loc, function (index, code) {
                    $('<i />', {
                        class: 'flag flag-' + code,
                        text: code
                    }).appendTo(li_flags);
                })
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

                self.sCurrentHoster = this.getAttribute('rel');
                self.renderHosterSelector();
                self.renderCalculator();

                $list.hide();
            });
            $(document).click(function () {
                $styledSelect.removeClass('active');
                $list.hide();
            });
        });
    };

    self.renderCalculator = function () {

        var tariffPlans = self.pricing[self.sKey].tariffPlans;

        if (tariffPlans.length > 0) {
            $.each(tariffPlans, function () {
                if (this.type.toLowerCase() === 'fixed') {
                    self.fixed = this;
                }
                if (this.type.toLowerCase() === 'flexible') {
                    self.dynamic = this;
                }
                if (this.type.toLowerCase() === 'network') {
                    self.network = this;
                }
                if (this.type.toLowerCase() === 'storage') {
                    self.storage = this;
                }
                if (this.keyword.toLowerCase() === 'ip') {
                    self.ip = this;
                }
            });
        }

        var sHtml = new EJS({url: '/j-calculator/templates/j-calculator'}).render({
            localization: self.localization,
            oLanguages: self.oLanguages,
            id: Math.round(Math.random() * 100000000),
            currencies: self.currencies,
            startCurrency: self.startCurrency,
            period: self.period,
            cloudlets: self.cloudlets
        });

        if ($(self.element).find('.calculator-wrapper').length > 0) {
            $(self.element).find('.calculator-wrapper').replaceWith(sHtml);
        } else {
            $(self.element).append(sHtml);
        }

        self.element.setAttribute('data-mode', 'appserver');

        for (var i = 0, oHoster; oHoster = self.oHosters[i]; i++) {
            if (self.sKey === oHoster.key) {
                self.hosterCurrency = oHoster.currencyCode;
            }
        }

        $(self.element).find('.current-switcher').each(function () {

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
                $this.val(this.getAttribute('rel')).change();
                $list.hide();
            });

            $(document).click(function () {
                $styledSelect.removeClass('active');
                $list.hide();
            });

        });

        var sliders = {
            'appserver': self.Slider($(self.element).find('.appserver-range input'), ''),
            'balancer': self.Slider($(self.element).find('.balancer-range input'), ''),
            'database': self.Slider($(self.element).find('.database-range input'), ''),
        };


        $(self.element).find('input[name*="mode"]').click(function (e) {
            self.element.setAttribute('data-mode', this.value);
            self.setMinValues(self.element.getAttribute('data-mode'));
            self.setMaxValues(self.element.getAttribute('data-mode'));
        });
        $(self.element).find('input[name*="mode"][value=appserver]').click();
        $(self.element).find('.min-block-decrease').click(function (e) {
            e.preventDefault();
            var slider = sliders[self.element.getAttribute('data-mode')];
            self.decreaseReserved(slider);
        });
        $(self.element).find('.min-block-increase').click(function (e) {
            e.preventDefault();
            var slider = sliders[self.element.getAttribute('data-mode')];
            self.increaseReserved(slider);
        });
        $(self.element).find('.max-block-decrease').click(function (e) {
            e.preventDefault();
            var slider = sliders[self.element.getAttribute('data-mode')];
            self.decreaseScaling(slider);
        });
        $(self.element).find('.max-block-increase').click(function (e) {
            e.preventDefault();
            var slider = sliders[self.element.getAttribute('data-mode')];
            self.increaseScaling(slider);
        });


        $(self.element).find('.node-count input').change(function (e) {
            var digit = $(this);

            self.cloudlets[this.getAttribute('name')].nodes = +this.value;

            if (parseInt(digit.val()) > parseInt(digit.attr('max'))) {
                digit.val(digit.attr('max')).change();
            }

            if (parseInt(digit.val()) < 0 || digit.val() === '') {
                digit.val(0).change();
            }

            self.setPrice();
        });

        $(self.element).find('.digit').change(function (e) {
            var digit = $(this);

            self.cloudlets[this.getAttribute('name')] = +this.value;

            if (parseInt(digit.val()) > parseInt(digit.attr('max'))) {
                digit.val(digit.attr('max')).change();
            }

            if (parseInt(digit.val()) < 0 || digit.val() === '') {
                digit.val(0).change();
            }

            self.setPrice();
        });


        $(self.element).find('.plus').click(function (e) {
            e.preventDefault();
            var digit = $(this).closest('.inner').find('.digit');
            digit.val(parseInt(digit.val()) + 1).change();
        });
        $(self.element).find('.minus').click(function (e) {
            e.preventDefault();
            var digit = $(this).closest('.inner').find('.digit');
            if (parseInt(digit.val()) > 0) {
                digit.val(parseInt(digit.val()) - 1).change();
            }
        });
        $(self.element).find('.plus-node').click(function (e) {
            e.preventDefault();

            var digit = $(this).closest('.node-count').find('input');
            digit.val(parseInt(digit.val()) + 1).change();

        });
        $(self.element).find('.minus-node').click(function (e) {
            e.preventDefault();

            var digit = $(this).closest('.node-count').find('input');
            if (parseInt(digit.val()) > 0) {
                digit.val(parseInt(digit.val()) - 1).change();
            }

        });
        $(self.element).find('.calculator-right input').click(function (e) {
            self.period = $(this).val();
            self.setPrice();
        });
        $(self.element).find('.current-switcher').change(function (e) {
            self.setPrice();
        });

        $('.j-calculator').removeClass('loading');

        self.loaded = true;

    };

    self.getAllData = function () {

        // init hoster keyword
        $.each(self.oHosters, function (index, hoster) {
            if (hoster.keyword === self.sCurrentHoster) {
                self.sKey = hoster.key;
                return false;
            }
        });

        self.renderHosterSelector();
        self.renderCalculator();

    };

    if (self.element) {

        // load currencies dependencies
        if (JApp.pricing.isLoadedCurrencies()) {
            self.currencies = JApp.pricing.getCurrecies();
            self.setLoaded('currencies');
        } else {
            JApp.pricing.loadCurrencies(function (response) {
                self.currencies = response;
                self.setLoaded('currencies');
            });
        }

        // programming languages
        self.oLanguages = self.element.getAttribute('data-languages') || ['java', 'php', 'node', 'python', 'go', 'ruby'];
        if (!Array.isArray(self.oLanguages)) {
            self.oLanguages = self.oLanguages.split(",").map(function (item) {
                return item.trim();
            });
        }

        // start period
        self.period = self.element.getAttribute('data-period') || 'hourly';

        // start currency
        self.startCurrency = self.element.getAttribute('data-start-currency') || 'USD';

        // load hoster/hosters data
        if (self.sKey) {

            $.ajax({
                type: "GET",
                url: 'https://' + self.sKey + '/auth/GetDefaultPricingModels',
                dataType: "json",
                async: true,
                success: function (hosterPricingJSON) {
                    if (hosterPricingJSON.result === 0 && hosterPricingJSON.response.models[0]) {
                        self.pricing[self.sKey] = hosterPricingJSON.response.models[0];
                        self.setLoaded('pricing');
                    } else {
                        throw new Error('Can not get hoster pricing model');
                    }
                },
                error: function (response) {
                    throw new Error(response);
                }
            });

            $.ajax({
                type: "GET",
                url: 'https://' + self.sKey + '/settings/GetHosterSettings',
                dataType: "json",
                async: true,
                success: function (hosterSettingsJSON) {
                    if (hosterSettingsJSON.result === 0 && hosterSettingsJSON.response.settingsCurrencyCode) {
                        self.hosterCurrency = self.element.getAttribute('data-hoster-currency') || hosterSettingsJSON.response.settingsCurrencyCode;
                        self.setLoaded('defaultHoster');
                    } else {
                        throw new Error('Can not get hoster default currency');
                    }
                },
                error: function (response) {
                    throw new Error(response);
                }
            });

        } else {

            var sHosterCriteria = Math.round(Math.random() * 100000000);

            // load all hosters
            if (JApp.isLoadedHosters()) {
                self.oHosters = JApp.getHosters();
                self.setLoaded('hosters');
            } else {
                JApp.loadHosters(function (response) {
                    self.oHosters = response;
                    self.setLoaded('hosters');
                });
            }

            // init default user hoster
            if (JApp.isLoadedDefHoster()) {
                self.sCurrentHoster = JApp.getDefaultHoster();
                self.setLoaded('defaultHoster');
            } else {
                JApp.loadDefaultHoster(function (response) {
                    self.sCurrentHoster = response;
                    self.setLoaded('defaultHoster');
                }, sHosterCriteria);
            }

            // load all pricing models
            if (JApp.pricing.isLoadedPricing()) {
                self.pricing = JApp.pricing.getPricing();
                self.setLoaded('pricing');
            } else {
                JApp.pricing.loadPricings(function (response) {
                    self.pricing = response;
                    self.setLoaded('pricing');
                });
            }

        }
    } else {
        throw new Error('Ooops! Something was wrong!');
    }

};

jQuery(document).ready(function ($) {

    var $jelasticCalculators = $('.j-calculator'),
        ojelasticCalculators = [];

    if ($jelasticCalculators.length > 0) {
        $.each($jelasticCalculators, function (index) {
            this.classList.add('loading');
            var oAtts = {
                oElement: this
            };
            if (this.getAttribute('data-key')) {
                oAtts['sKey'] = this.getAttribute('data-key');
            }
            ojelasticCalculators[index] = new JApp.pricing.Calculator(oAtts);
        });
    }

    $(window).resize(function () {
        $(ojelasticCalculators).each(function () {
            if (this.loaded) {
                this.setMinValues(this.element.getAttribute('data-mode'));
                this.setMaxValues(this.element.getAttribute('data-mode'));
            }
        });
    });

});