// render hoster selector
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
    sHtml = new EJS({url: '/j-calculator/templates/j-hoster-selector'}).render({
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
            $(el).attr('data-hoster', oHoster.keyword);
            $(el).attr('data-custom-signup', oHoster.customSignUp);
        }
    }
    if ($(el).find('.hoster-selector').length > 0) {
        $(el).find('.hoster-selector').replaceWith(sHtml);
    } else {
        $(el).append(sHtml);
    }
    $(el).find('.hoster-selector--select').each(function () {
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
            var loc = $this.children('option').eq(i).attr('data-location').split(',').filter(onlyUnique);
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
            $this.val($(this).attr('rel')).change();
            $list.hide();
        });
        $(document).click(function () {
            $styledSelect.removeClass('active');
            $list.hide();
        });
    });
}

// rerender calculator after hoster change
$(document).on('change', '.hoster-selector--select', function (e) {
    var calculatorElement = $(this).closest(calculatorTag)[0];
    sCurrentHoster = $(this).val();
    renderHosterSelector(calculatorElement);
    renderCalculator(calculatorElement);
});

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}