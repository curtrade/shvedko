var serverPath = 'https://shvedko.herokuapp.com';

var geoMap;
var lastAddr = '';
var lastCollection = 0;
var depth = [], names = {};
var osmGeoMap = {};
var legendInfoMap = {};
var groupedByPeriod = {};


ymaps.ready(init);

$(function() {
    $.ajaxSetup({
        beforeSend: function (xhr) {
            xhr.overrideMimeType('application/json; charset=utf-8');
        }
    });

    $('#period-range').on('change', function () {
        renderData(this.value);
    });

    loadCategories();
});

function init() {
    geoMap = new ymaps.Map("map", {
        center: [69.88029828460236, 105.2222948743419],
        zoom: 2
    });

    geoMap.geoObjects.events
        .add('mouseenter', function (e) {
            e.get('target').options.set({
                strokeColor: '#0008',
                strokeWidth: 2
            });
        })
        .add('mouseleave', function (e) {
            e.get('target').options.set({
                strokeColor: '#44F',
                strokeWidth: 1
            });
        });

    loadMapLayer('RU');
}

function loadMapLayer(addr, callback) {
    if (addr === lastAddr) {
        return;
    }

    loadMask(true);

    lastAddr = addr;
    osme.geoJSON(addr, {lang: 'ru', recombine: 'ru'}, function (data) {
        if (!data.metaData) {
            loadMask(false);
            alert('Нет данных :(');
            return;
        }

        var thisId = data.metaData.osmId;
        for (var i in data.features) {
            (function (i) {
                if (data.features[i].properties.osmId == thisId) {
                    names[addr] = data.features[i].properties.name;
                }
            })(i);
        }

        var animDuration = depth.length === 0 ? 0 : 300;

        depth.push(addr);
        buildBreadcrumbs();

        var collection = osme.toYandex(data);
        if (lastCollection) {
            lastCollection.remove(geoMap);
        }
        lastCollection = collection;
        collection.add(geoMap);

        geoMap.setBounds(collection.collection.getBounds(), {duration: animDuration});
        var strokeColors = [
            '#000',
            '#F0F',
            '#00F',
            '#0FF',
        ];
        var meta = data.metaData,
            minLevel = meta.levels[0],
            maxLevel = meta.levels[1] + 1;
        collection.setStyles(function (object, yobject) {
            var level = object.properties.level;
            return ({
                zIndex: level,
                zIndexHover: level,
                strokeWidth: Math.max(1, level == 2 ? 2 : (maxLevel - level)),
                strokeColor: strokeColors[maxLevel - level] || '#000',
                fillColor: '#FFE2',
                balloonPanelMaxMapArea: Infinity,
                balloonAutoPan: false,
                autoPanDuration: animDuration
            });
        });

        collection.addEvent('contextmenu', function (object, type, target, event) {
            event.preventDefault();
        });

        collection.addEvent('click', function (object, type, target, event) {
            event.preventDefault();

            if (console) {
                console.log(object.properties);
            }

            var osmId = object.properties.osmId;
            if (osmId) {
                geoMap.setBounds(target.geometry.getBounds(), {duration: animDuration});
                setTimeout(function () {
                    loadMapLayer('' + osmId);
                }, 1);
            }
        });

        buildGeoObjectMap();

        loadMask(false);

        if (callback) {
            callback();
        }
    }, function (error) {
        loadMask(false);

        if (console) {
            console.log(error);
        }

        alert('Произошла ошибка при загрузке данных');
    });
}

function buildBreadcrumbs() {
    var d = $("#breadcrumbs");
    d.html('');
    for (var i in depth) {
        (function (i) {
            var name = depth[i];
            var oname = names[name] || name;
            var l = $("<a href='#'>" + oname + "</a>");
            l.click(function () {
                $('#data-selector>a').removeClass('active');
                $('#data-controls').hide();

                depth.length = i;
                loadMapLayer(name);
                return false;
            });
            l.appendTo(d);
            if (i < depth.length - 1) {
                d.append("&nbsp;&raquo;&nbsp;");
            }
        })(i);
    }
}

function buildGeoObjectMap() {
    osmGeoMap = {};
    if (lastCollection) {
        lastCollection.collection.each(function (geoobj) {
            var osmId = geoobj.properties.get('osmId');
            if (osmId != lastAddr) {
                osmGeoMap[osmId] = geoobj;

                //setGeometryFillRate(osmId, Math.random()*100);
            }
        })
    }
}

function percentToColor(percent, alpha) {
    percent = percent > 100 ? 100 : (percent < 0 ? 0 : percent);
    percent = 100 - percent; // reverse value
    r = percent < 50 ? 255 : Math.floor(255 - (percent * 2 - 100) * 255 / 100);
    g = percent > 50 ? 255 : Math.floor((percent * 2) * 255 / 100);
    return 'rgba(' + r + ',' + g + ',0,' + alpha + ')';
}

function setGeometryFillRate(osmId, percentage) {
    var g = osmGeoMap[osmId];
    if (g) {
        g.options.set({
            fillColor: percentage >= 0 ? percentToColor(percentage, 0.6) : 'rgba(255,255,255,0)'
        });
    }
}

function loadMask(shown) {
    $('#loadmask').css('display', shown ? 'block' : 'none');
}

function loadData(type) {
    var data = {
        osmIds: Object.keys(osmGeoMap)
    };
    loadMask(true);
    $.post(serverPath + '/get_osm_data/' + type, data)
        .done(function (data) {
            var n, v, el, period;
            var minPeriod = Infinity, maxPeriod = -Infinity;

            groupedByPeriod = {};
            for (n = 0; n < data.length; n++) {
                el = data[n];

                period = periodToMonths(el.year, el.month);
                if (!groupedByPeriod[period]) {
                    groupedByPeriod[period] = {
                        minValue: Infinity,
                        maxValue: -Infinity,
                        values: {}
                    }
                }
                groupedByPeriod[period].values[el.osm_id] = el.param_value;
                groupedByPeriod[period].minValue = Math.min(groupedByPeriod[period].minValue, el.param_value);
                groupedByPeriod[period].maxValue = Math.max(groupedByPeriod[period].maxValue, el.param_value);

                minPeriod = Math.min(minPeriod, period);
                maxPeriod = Math.max(maxPeriod, period);
            }

            console.log(minPeriod, maxPeriod)
            var pr = $('#period-range')[0];
            pr.min = minPeriod === Infinity ? 0 : minPeriod;
            pr.max = maxPeriod === -Infinity ? 0 : maxPeriod;
            pr.value = pr.max;

            var legend = legendInfoMap[type];
            if (legend) {
                $('#legend-green').html(legend.min);
                $('#legend-red').html(legend.max);
                $('#data-controls').show();
            } else {
                $('#data-controls').hide();
            }

            renderData(maxPeriod);
        })
        .fail(function () {
            alert('Произошла ошибка при загрузке данных');
        })
        .always(function () {
            loadMask(false);
        });
}

function renderData(period) {
    $('#period-value').html(monthsToPeriod(period));

    var data = groupedByPeriod[period];
    if (!data) {
        for (var osmId in osmGeoMap) {
            setGeometryFillRate(osmId, NaN);
        }
        return;
    }

    var zero = data.maxValue - data.minValue;

    for (var osmId in osmGeoMap) {
        var el = data.values[osmId];
        var v = el ? ((el - data.minValue) / zero * 100) : NaN;

        setGeometryFillRate(osmId, v);
        //console.log(osmId, v)
    }
}

function loadCategories() {
    $.getJSON(serverPath + '/get_params', function (data) {
        var sel = $('#data-selector');
        for (var n = 0; n < data.length; n++) {
            var el = data[n];
            var lnk = $('<a class="list-group-item list-group-item-action" data-type="{0}" data-toggle="list" href="#" role="tab">{1}</a>'.format(el.id, el.name));
            lnk.appendTo(sel);

            legendInfoMap[el.id] = {
                min: el.min_legend,
                max: el.max_legend
            };
        }

        $('#data-selector>a').on('click', function (e) {
            e.preventDefault();

            $(this).tab('show');
            loadData($(this).data('type'));
        });
    });
}

function periodToMonths(year, month) {
    return year * 12 + (month - 1);
}

function monthsToPeriod(months) {
    if (months > 0) {
        var year = Math.floor(months / 12);
        var month = (months % 12) + 1;

        return year + '-' + month;
    } else {
        return '';
    }
}