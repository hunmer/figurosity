var a_get = getGETArray();
//var g_s_api = 'php/';
var g_s_api = 'https://figurosity.glitch.me/';
var g_localKey = 'figurosity_';
// 本地储存前缀
var g_config = local_readJson('config', {
});
var g_v_quickPose = local_readJson('quickPose', {
    "durations": [1],
    "camera_angle": [0, 1, 2],
    "pose_direction": [0, 1],
    "models": [0, 1, 2, 3],
    "gender": [0],
    "light_direction": [0, 1]
});

var g_v_poseSearch = {
    "page": 1,
    "models": [],
    "cameras": [],
    "gender": [],
    "style": [],
    "action": [],
    "props": []
};

var g_b_loading = false;
var g_i_loading_last = 0;
var g_s_ui_last = 'main';
// 返回到的ui
$(function() {
    M.AutoInit();
    $('.chips-placeholder').chips();
    //showUI("pose-search");

    initQuickPose();
    $(document).on('click', '#quick-pose .row div', function(event) {
        if ($(this).attr('data-disable') !== undefined)
            return;
        var parent = $(this).parents(".section");
        if (parent.attr('data-mult') == 'false') {
            parent.find('._active').removeClass('_active');
        }
        $(this).toggleClass('_active');
        if (this.id != '_custom-time') {
            saveQuickPose();
        }
    }).on('change', '#modal_fitler select', function(event) {
        var parent = $(this).parents('.section');
        M.Chips.getInstance(parent.find('.chips')[0]).addChip({
            tag: parent.find('.selected').find('span').html(),
        });
        //getSearchPoseParams();
    });

    $(window).scroll(function() {
        var scrollTop = $(this).scrollTop();
        //滚动条距离顶部的高度
        var scrollHeight = $(document).height();
        //当前页面的总高度
        var clientHeight = $(this).height();
        //当前可视的页面高度
        // console.log("top:"+scrollTop+",doc:"+scrollHeight+",client:"+clientHeight);
        var i = scrollHeight - (scrollTop + clientHeight);
        if (i <= 30) {
            //距离顶部+当前高度 >=文档总高度 即代表滑动到底部 
            //滚动条到达底部
            if (!$('#pose-search').hasClass('hide')) {
                var now = new Date().getTime() / 1000;
                if (!g_b_loading && now - g_i_loading_last >= 3) {
                    g_i_loading_last = now;
                    g_b_loading = true;
                    g_v_poseSearch.page++;
                    pose_search();
                }
            }
        } else if (scrollTop <= 0) {//滚动条到达顶部
        }
    });

    $('.chips-placeholder input').attr('disabled', true);
    // $('#main').addClass('hide');
    // $('#ui_viewer').removeClass('hide');
    //quickPose_preload();
    //loadId(JSON.parse(`{"id":622,"uuid":"7572040f-60c4-438e-9934-50fb98696be5","render_count":36,"camera_id":1,"favorited_by_current_user":false,"favorite_count":6,"favorite_text":"6 people just love this.","models":[{"id":5,"name":"Mei Lin","slug":"mei-lin","machine_name":"mei-lin","gender_id":111}],"states":[{"id":1,"name":"Dressed","slug":"normal","type":"normal","machine_name":"normal","order":1}]}`));
});

function saveQuickPose() {
    for (let key of Object.keys(g_v_quickPose)) {
        g_v_quickPose[key] = [];
        $('#' + key + " .row .col").each(function(index, dom) {
            if ($(dom).hasClass('_active')) {
                if (key == 'durations') {
                    if ($('#_custom-time').hasClass('_active')) {
                        var s = parseInt($('#_custom-time').html().replace('s', ''));
                        g_v_quickPose[key] = [-1, s];
                        g_v_cd.default = s;
                        return false;
                    } else {
                        g_v_cd.default = $(dom).attr('data-sec');
                    }
                }
                g_v_quickPose[key].push(index);
            }
        });
    }
    local_saveJson('quickPose', g_v_quickPose);
    //console.log(g_v_quickPose);

}

function getSearchPoseParams() {
    //{"page":1,"models":["ashley","cara"],"cameras":["default"],"gender":[],"style":["martial-arts-poses"],"action":["flying"],"props":["bow"]}
    var value, params = {};
    for (let key in g_v_poseSearch) {
        value = g_v_poseSearch[key];
        if (key == "page") {
            params["page"] = value;
            continue;
        }
        params[key] = [];
        for (var d of M.Chips.getInstance($('#ps_' + key + ' .chips')[0]).chipsData) {
            params[key].push(d.tag);
        }
    }
    return JSON.stringify(params);
}

function getQuickPoseParams() {
    // {"states":["normal","nude","muscle","smooth"],"gender":[110,111],"cameras":[1,2,3],"museCount":"single","count":10}
    var value, params = {
        "museCount": "single",
        "count": 20
    };
    for (let key in g_v_quickPose) {
        value = g_v_quickPose[key];
        switch (key) {
        case 'models':
            params["states"] = getOtherArrayKey(value, ["normal", "nude", "muscle", "smooth"]);
            break;

        case 'gender':
            params["gender"] = getOtherArrayKey(value, [110, 111]);
            break;

        case 'camera_angle':
            params["cameras"] = getOtherArrayKey(value, [1, 2, 3]);
            break;
        }
    }
    return JSON.stringify(params);
}

function getOtherArrayKey(value, list) {
    var res = [];
    value.forEach(function(index) {
        if (list[index] !== undefined) {
            res.push(list[index]);
        }
    });
    return res;
}

function initQuickPose() {
    var value;
    for (let key in g_v_quickPose) {
        value = g_v_quickPose[key];
        if (key == 'durations') {
            if (value.length > 1) {
                $('#_custom-time').html(value[1] + 's').addClass('_active');
                g_v_cd.default = value[1];
                continue;
            }
        }
        for (let index of value) {
            $('#' + key + " .row .col:eq(" + (index) + ")").addClass('_active');
        }
    }
}

function confirm_setCustomTime() {
    x0p({
        title: 'Custom Duration',
        type: 'warning',
        inputType: 'text',
        inputPlaceholder: 'Seconed',
        inputColor: '#F29F3F',
        inputPromise: function(button, value) {
            var p = new Promise(function(resolve, reject) {
                if (value == '' || isNaN(value) || value <= 0)
                    resolve('Not a number!');
                resolve(null);
            }
            );
            return p;
        }
    }, function(button, text) {
        if (button == 'warning') {
            $('#_custom-time').html(text + 's').addClass('_active');
            saveQuickPose();
        }
    });
}

function quickPose_preload() {
    var b = false;
    $('#btn-start').html('Loading...');

    var url = g_s_api+'api.php?type=quick-pose&data=' + getQuickPoseParams();
    $.ajax({
        url: url,
        method: 'GET',
        // async: false,
        dataType: 'json',
        success: function(json) {
            $('#quick-pose').addClass('hide');
            $('#ui_viewer').removeClass('hide');
            // json.total
            if ($('#x0popup').length > 0) {
                x0p('Done', null, 'ok', false);
            }
            quickPose_load(json.data);
            b = true;
        },
        always: function() {
            $('#btn-start').html('START');
        }
    });
    return b;
}

var g_v_poses = [];
//加载的pose列表

function pose_search() {
    $('#_count').html('Loading...');
    var url = g_s_api+'api.php?type=pose-search&data=' + getSearchPoseParams();
    $.ajax({
        url: url,
        method: 'GET',
        // async: false,
        dataType: 'json',
        success: function(json) {
            // total: 7633 total_pages: 191
            $('#_count').html(json.poses.meta.total + ' Poses');
            var html = '';
            for (var d of json.poses.data) {
                g_v_poses["id-" + d.id] = d;
                html = html + `<div class="col s6">
				<img onclick="loadViewer(` + d.id + `)" src="` + getImageUrl(d.uuid, 'normal').replace('{size}', 100).replace('{offset}', '00') + `">
			</div>`;
            }
            $('#_list').append(html);
        }

    }).always(function() {
        $('#btn-search').html('SEARCH');
        g_b_loading = false;
    });
}

// 定时器
var g_v_timer = {
    'quick_pose': 0,
};

// 倒计时
var g_v_cd = {
    'playTime': 0,
    // 总计时
    'default': 3,
    // 默认值
    'main': -1,
    // 倒计时
    'stop': true,
    'next': -1,
    //到下张的倒计时
    'next_default': 3,
    //默认到下张的倒计时
};

var g_quickPose = {};
function quickPose_load(data) {
    g_s_ui_last = 'main';
    g_quickPose = data;
    g_quickPose.index = 0;
    $(window).bind('keydown', function(ev) {
        switch (ev.key) {
        case 'ArrowRight':
            offset_next();
            break;

        case 'ArrowLeft':
            offset_prev();
            break;
        }
    });
    var t;
    g_v_timer.quick_pose = setInterval(function() {
        g_v_cd.playTime++;
        $('#_playSec').html(_s1(g_v_cd.playTime));

        t = g_v_cd.next;
        if (t > 0) {
            $('#_sec-next').html(_s1(t));
            if (--g_v_cd.next == 0) {
                g_v_cd.stop = true;
                // 稍微延迟看起来更自然
                setTimeout(function() {
                    next_pose();
                }, 500);
            }
            return;
        }
        if (!g_v_cd.stop) {
            var sec = --g_v_cd.main;
            $('#_sec').html(_s1(sec));

            if (sec < 0) {
                if (g_v_cd.next_default > 0) {
                    $('#viewer img').css('opacity', 0);
                    g_v_cd.next = g_v_cd.next_default;
                    $('#_sec-next').html('').removeClass('hide');
                    return;
                }
                g_v_cd.stop = true;
                next_pose();
            }
        }

    }, 1000);
    loadIndex(g_quickPose.index);

    // 预加载所有图片第一张
    g_a_offsets = [];
    var offset, key, img, model = '', size = g_v_viewing.size;
    for (var d of data) {
        offset = _s(randNum(0, 32));
        // TODO 随机
        g_a_offsets["id-" + d.id] = offset;
        model = 'normal';
        if (g_v_viewing.model != 'normal') {
            // 默认的不用找
            for (var m of d.states) {
                if (m.type == g_v_viewing.model) {
                    model = m.type;
                    // 找到了
                    break;
                }
            }
        }
        key = model + '-' + offset + '-' + size;
        preloadImage(d.id, key, getImageUrl(d.uuid, model).replace('{size}', size).replace('{offset}', offset));
    }

}

function getImageUrl(uuid, model) {
    return 'https://love.figurosity.com/muses/' + uuid.substr(0, 2) + '/' + uuid.substr(2, 2) + '/' + uuid.substr(4, 2) + '/' + uuid + '/' + model + '/{size}/pose-{offset}.jpg';
}

function next_pose() {
    if (g_quickPose.index == g_quickPose.length - 1) {
        // 到底了
        x0p({
            title: 'Want load more?',
            text: '',
            icon: 'info',
            animationType: 'fadeIn',
            buttons: [{
                type: 'cancel'
            }, {
                type: 'ok',
                text: 'More',
                showLoading: true
            }, {
                type: 'info',
                text: 'Again'
            }]
        }).then(function(data) {
            if (data.button == 'ok') {
                quickPose_preload();
                // setTimeout(function() {

                // }, 1500);
            } else if (data.button == 'info') {
                g_quickPose.index = 0;
                loadIndex(0);
                start_countDown();
            }
        });

        quickPose_end();
        return;
    }
    loadIndex(++g_quickPose.index);
}

function loadViewer(id) {
    g_s_ui_last = 'pose-search';
    var json = g_v_poses["id-" + id];
    showUI("ui_viewer");
    loadId(json);

}

function reset_fitler() {
    $('.chips').each(function(index, el) {
        M.Chips.getInstance(el).chipsData = [];
    });
    $('.chips-placeholder').chips();
}

function showUI(id) {
    $('.container').each(function(index, el) {
        if (el.id == id) {
            $(el).removeClass('hide');
        } else {
            $(el).addClass('hide');
        }
    });
}

function prev_pose() {
    if (g_quickPose.index == 0) {
        // 到底了
        return;
    }
    loadIndex(--g_quickPose.index);
}

function loadIndex(index) {
    $('#_index').html((index + 1) + '/' + g_quickPose.length);
    loadId(g_quickPose[index]);
}

function quickPose_end() {
    if (g_v_timer.quick_pose > 0) {
        clearInterval(g_v_timer.quick_pose);
        g_v_timer.quick_pose = 0;
    }
}

var g_v_viewing;
// json
var g_a_offsets = [];
// 预先加载的offset - quickpose

function loadId(json) {
    $('#_sec').html('<i class="material-icons">refresh</i>');
    g_v_viewing = {
        'data': json,
        'model': 'normal',
        'size': 512,
        'eyeLevel': 'Street'
    };
    g_v_cd.main = g_v_cd.default;
    // 读取预先随机生成的offset

    var offset = g_a_offsets["id-" + json.id] == undefined ? 0 : g_a_offsets["id-" + json.id];
    loadImage(json.id, json.uuid, offset);
    // {"id":5,"name":"Mei Lin","slug":"mei-lin","machine_name":"mei-lin","gender_id":111}
    //model.name;	
    for (var state of json.states) {// {"id":1,"name":"Dressed","slug":"normal","type":"normal","machine_name":"normal","order":1}
    }
}

function start_countDown() {
    g_v_cd.stop = false;
}

function loadImage(id, uuid, offset='00', size='512', model='normal') {
    $('#range').val(parseInt(offset)).focus();
    if (g_v_favorites["id-" + id] !== undefined) {
        $('#favorite').html('favorite');
    } else {
        $('#favorite').html('favorite_border');
    }

    offset = _s(offset);
    var img = getImageUrl(uuid, model);
    var key = model + '-' + offset + '-' + size;
    if (g_a_preloadImages[id] !== undefined && g_a_preloadImages[id][key] !== undefined && g_a_preloadImages[id][key][1]) {
        // 已经预加载过
        $('._control ._title').html('');

        imageLoader($('#viewer img').attr('src', img.replace('{size}', size).replace('{offset}', offset)));
        start_countDown();
    } else {
        imageLoader($('#viewer img').attr('src', img.replace('{size}', 100).replace('{offset}', offset)));
        // 略缩图

        preloadImage_single(img.replace('{size}', size).replace('{offset}', offset));
        if (true) {
            // preload all images
            for (var i = 0; i <= 32; i++) {
                preloadImage(id, model + '-' + _s(i) + '-100', img.replace('{size}', 100).replace('{offset}', _s(i)));
                preloadImage(id, model + '-' + _s(i) + '-' + size, img.replace('{size}', size).replace('{offset}', _s(i)));
            }
        }
    }
}

function imageLoader(dom) {
    dom.imagesLoaded().fail(function(instance) {
        console.log('加载失败');
        instance.images[0].img.src = instance.images[0].src;
        // instance.images[0].src = ''; // 404
    }).done(function(instance) {
        instance.images[0].img.style.opacity = 1;
    }).always(function(instance) {
        $('#_sec-next').html('').addClass('hide');
    });
}

function setModel(model) {
    if (model != g_v_viewing.model) {
        g_v_viewing.model = model;
        $('._control ._title').html('Loading ' + model);
        initImage();
    }
}

function setEyeLevel(level) {
    if (level != g_v_viewing.level) {
        g_v_viewing.eyeLevel = level;
        initImage();
    }
}

function initImage(thumb=false) {
    loadImage(g_v_viewing.data.id, g_v_viewing.data.uuid, g_v_viewing.offset, thumb ? 100 : g_v_viewing.size, g_v_viewing.model);
}

function event_rangeChange(thumb=false) {
    g_v_viewing.offset = _s($('#range').val());
    initImage(thumb);
}

function _view(name) {
    switch (name) {
    case 'quick-pose':
        showUI('quick-pose');
        break;

    case 'pose-search':
        showUI('pose-search');
        if (g_v_poses.length == 0) {
            pose_search();
        }
        break;
    }
}

function offset_next() {
    var offset = parseInt($('#range').val());
    if (offset < 32) {
        setOffset(++offset);
    }
}

function offset_prev() {
    var offset = parseInt($('#range').val());
    if (offset > 0) {
        setOffset(--offset);
    }
}

function setOffset(offset) {
    $('#range').val(offset).focus();
    g_v_viewing.offset = offset;
    initImage();
}

var g_v_image_single = new Image();
g_v_image_single.onload = function() {
    $('#viewer img').attr('src', this.src).css('opacity', 1);
    $('._control ._title').html('');
    start_countDown();
}

function preloadImage_single(src) {
    g_v_image_single.src = src;
}

function stop() {
    g_v_cd.stop = !g_v_cd.stop;
    $('#pause').html(g_v_cd.stop ? 'play_arrow' : 'pause');
}

function download(url='') {
    if (url == '')
        url = $('#viewer img').attr('src');
    fetch(url).then(res=>res.blob().then(blob=>{
        var a = document.createElement('a');
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = g_v_viewing.data.id + '-' + g_v_viewing.model + '-' + g_v_viewing.offset + '.jpg';
        a.click();
        window.URL.revokeObjectURL(url);
    }
    ))
}

var g_v_favorites = local_readJson('favorites', {});
function favorite(dom=null, json=null, b=null) {
    if (json === null)
        json = g_v_viewing.data;
    var key = "id-" + json.id;

    if (g_v_favorites[key] == undefined) {
        if (b === null)
            b = true;
    } else {
        if (b === null)
            b = false;
    }
    if (b) {
        g_v_favorites[key] = json;
    } else {
        delete (g_v_favorites[key]);
    }
    if (dom !== null) {
        dom.html(b ? 'favorite' : 'favorite_border');
    }
    local_saveJson('favorites', g_v_favorites);
    return b;
}

var g_a_preloadImages = [];
function preloadImage(id, offset, src) {
    // console.log('preload : ' + id + ' ' + offset);

    return new Promise(function(resolve, reject) {
        if (g_a_preloadImages[id] == undefined) {
            g_a_preloadImages[id] = [];
        }

        let img = new Image();
        g_a_preloadImages[id][offset] = [img, false];
        img.onload = function() {
            g_a_preloadImages[id][offset][1] = true;
            resolve(img);
            //加载时执行resolve函数
        }
        img.onerror = function() {
            reject(src + '这个地址错误');
            //抛出异常时执行reject函数
        }
        img.src = src;
    }
    )
}
