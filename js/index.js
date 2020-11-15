var a_get = getGETArray();
//var g_s_api = 'php/';
var g_s_api = 'https://figurosity.glitch.me/';
var g_localKey = 'figurosity_';
// 本地储存前缀
var g_config = local_readJson('config', {
    thumb_size: 512,
    image_size: 512,
    autoloadThumbs: false,
    viewer_on_click: 0,
    dark_mode: false,
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
    "Drawing references": {
        "page": 1,
        "slug": "" // dogs
    },
    "pose": {
        "page": 1,
        "models": [],
        "cameras": [],
        "gender": [],
        "style": [],
        "action": [],
        "props": []        
    }
};

var g_v_poseSearch_default = g_v_poseSearch; // 默认

var g_b_loading = false;
var g_i_loading_last = 0;
var g_s_ui_last = 'main';
// 返回到的ui
$(function() {
    if(g_config.dark_mode){
        switchDarkMode();
    }
    if(window.location.protocol == 'file:'){
        $('#option-Image-Size,#option-Thumb-Image-Size,a[href="#modal_fitler"], #option-autoload-thumbs,  #camera_angle, #models, #gender').hide();
        $('#load_count').show();
    }
    window.history.pushState(null, null, "#");
    window.addEventListener("popstate", function(event) {
        window.history.pushState(null, null, "#");
        event.preventDefault(true);
        event.stopPropagation();
        showUI();
        //$('#modal1').modal('close');
    });    

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
        var i = $(document).height() - (scrollTop + $(this).height());
        if (i <= 30) {
            //滚动条到达底部
                var type;
                var now = new Date().getTime() / 1000;
                if (!g_b_loading && now - g_i_loading_last >= 3) {
                    if (!$('#pose-favorites').hasClass('hide')) { // 收藏夹是一次显示完毕
                        return;
                    }else                    
                    if (!$('#pose-search').hasClass('hide')) {
                        type = 'pose-search';
                    }else
                    if (!$('#sets').hasClass('hide')) {
                        type = $('#sets').attr('data-type');
                    }        
                    if(type != undefined){
                        g_i_loading_last = now;
                        g_b_loading = true;
                        g_v_poseSearch[g_api.paramType].page++;
                        data_query(type);                        
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

    // openModal('#modal_setting');
    //showUI('ui_viewer');
});

function viewer_click(){
    switch(g_config.viewer_on_click){
        case '1':
            stop();
            break;

        case '2':
            next_pose();
            break;
    }
}

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
    console.log(g_v_quickPose);

}

function getSearchPoseParams(type = '') {
    //{"page":1,"models":["ashley","cara"],"cameras":["default"],"gender":[],"style":["martial-arts-poses"],"action":["flying"],"props":["bow"]}
    var dom;
    if(type == '') type = g_api.paramType;
    if(g_v_poseSearch[type] === undefined) return;
    var value, params = {};
    for (let key in g_v_poseSearch[type]) {
        value = g_v_poseSearch[type][key];
        if (key == "page") {
            params["page"] = value;
            continue;
        }
        dom = $('#ps_' + key + ' .chips');
        if(dom.length > 0){
            params[key] = []; // 数组参数

            for (var d of M.Chips.getInstance(dom[0]).chipsData) {
                params[key].push(d.tag);
            }            
        }else{
            params[key] = value; // 文本参数
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
var g_dirs = [];
var g_b_stopAjax = false;

function loadJs(file, success = function(){}, fail = function(){}){
    var D = document;
    var scriptNode = D.createElement('script');
    scriptNode.type = "text/javascript";
    scriptNode.src = file;
    var targ = D.getElementsByTagName('head')[0] || D.body || D.documentElement;
    targ.appendChild(scriptNode);
    scriptNode.onload = function() {
        success();
    }    
    scriptNode.onerror = function() {
        fail();
    }   
    return scriptNode;         
}
function loadLocalData(success = function(){}, fail = function(){}){
    loadJs('./figurosity.js', function(){
        console.log(g_dirs.length);
        success();
    }, function(){
        fail();
    });
}

function quickPose_preload() {
    setLoading(true);
    if (window.location.protocol == 'file:') {
        loadLocalData(function(){
            if(g_dirs.length === 0){
                setLoading(false);
                return alert('请先运行 "点我更新figurosity图片目录.exe" 程序再使用此功能!');
            }            
            var json = {
                data: shuffle(g_dirs, $('#load_count input').val())
            };
            data_load('quickpose', json);      
                  
        }, function(){
            setLoading(false);
            alert('请先运行 "点我更新figurosity图片目录.exe" 程序再使用此功能!');
        });
    }else{
        var url = g_s_api+'api.php?type=quick-pose&data=' + getQuickPoseParams();
        g_ajax = $.ajax({
            url: url,
            method: 'GET',
            // async: false,
            dataType: 'json',
            success: function(json) {
                if(g_b_stopAjax){g_b_stopAjax = false; return};
                data_load('quickpose', json);
            }
        }).always(function() {
            //setLoading(false);
        });        
    }
   
}

var g_v_poses = [];
//加载的pose列表

var g_i_list_index = 0; // 本地列表查看的索引
function data_query(type) {
    switch(type){
        case 'pose-search':
            $('#'+type+' .-count').html('Loading...');
            break;

        case 'pose-favorites':
            $('#pose-favorites .-list').html('');
            var data = {data: []};
            for(var d in g_v_favorites){
                data.data.push(d.replace('id-', ''));
            }
            data_load(type, data);
            return;
    }
    if (window.location.protocol == 'file:') {
        loadLocalData(function(){
            if(g_dirs.length === 0){
                setLoading(false);
                return alert('请先运行 "点我更新figurosity图片目录.exe" 程序再使用此功能!');
            }           
            var start = g_i_list_index;
            g_i_list_index += 30;
            var json = {
                data: g_dirs.slice(start, g_i_list_index)
            };
            data_load(type, json);
            setLoading(false);
        }, function(){
            setLoading(false);
            alert('加载数据失败!');
        });        
    }else{
        var url = g_s_api+'api.php?type='+g_api.type+'&data=' + getSearchPoseParams();
        g_i_loading_last = new Date().getTime() / 1000; // 防止直接进入页尾触发刷新

        setLoading(true);
        g_ajax = $.ajax({
            url: url,
            method: 'GET',
            // async: false,
            dataType: 'json',
            success: function(json) {
                if(g_b_stopAjax){g_b_stopAjax = false; return};
                data_load(type, json);
            }

        }).always(function() {
            $('#btn-search').html('SEARCH');
            setLoading(false);
        });        
    }
    
}

function data_load(type, json){
    console.log(json);
    var selecter;
    switch(type){
        case 'pose-search':
        case 'pose-favorites':
            g_s_ui_last = type;
            // total: 7633 total_pages: 191
            selecter = '#'+type+' .-list';
            $('#'+type+' .-count').html((window.location.protocol == 'file:' ? type == 'pose-favorites' ? json.data.length : g_dirs.length : json.poses.meta.total) + ' Poses'); 
            break;

        case 'dogs':
        case 'horses':
        case 'superhero-poses':
        case 'martial-arts-poses':
        case 'girls-with-guns-poses':     
            g_s_ui_last = 'sets';
            selecter = '#sets .-cover_list';
            break;

        case 'quickpose':
            g_s_ui_last = 'quick-pose';
            $('#quick-pose').addClass('hide');
            $('#ui_viewer').removeClass('hide');
            // json.total
            if ($('#x0popup').length > 0) {
                x0p('Done', null, 'ok', false);
            }
            return quickPose_load(json.data);
    }
    var html = '';
    var data = json.poses != undefined ? json.poses.data : json.data;
    for (var d of data) {
        if(typeof(d) !== 'object'){ // 本地数据
            d = {
                id: d,
                uuid: d
            };
        }
        g_v_poses["id-" + d.id] = d;
        html = html + `<div class="col s6">
        <img class="lazyload" onclick="loadViewer(` + d.id + `)" src="images/loading.gif" data-src="` + getImageUrl(d.uuid, 'normal').replace('{size}', g_config.thumb_size).replace('{offset}', getOffsetString('00')) + `">
        <p>`+d.id+`</p>
    </div>`;
    }
    $(selecter).append(html);    
    $(selecter + " .lazyload").lazyload({effect: "fadeIn"});
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
        $('#_playSec').html(getTimeString(g_v_cd.playTime));

        t = g_v_cd.next;
        if (t > 0) {
            $('#_sec-next').html(_s1(t));
            if (--g_v_cd.next == 0) {
                stop(true);
                // 稍微延迟看起来更自然
                setTimeout(function() {
                    next_pose(true);
                }, 500);
            }
            return;
        }
        if (!g_v_cd.stop) {
            var sec = --g_v_cd.main;

            if (sec < 0) {
                if (g_v_cd.next_default > 0) {
                    $('#viewer img').css('opacity', 0);
                    g_v_cd.next = g_v_cd.next_default;
                    $('#_sec-next').html('').removeClass('hide');
                    return;
                }
                stop(true);
                next_pose(true);
            }else{
                let s = _s1(sec);
                $('#_sec').html(s == '' ? '<i class="material-icons">refresh</i>' : s);
            }
        }

    }, 1000);
    loadIndex(g_quickPose.index);

    // 预加载所有图片第一张
    g_a_offsets = [];
    var offset, key, img, model = '', size = g_config.image_size;
    for (var d of data) {
        if(typeof(d) !== 'object'){ // 本地数据
            d = {
                id: d,
                uuid: d
            };
        }      
        offset = getOffsetString(randNum(0, 32));
        // TODO 随机
        g_a_offsets["id-" + d.id] = offset;
        model = getDefaultModel();
        if (g_v_viewing.model != 'normal' && d.states != undefined) {
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

    // start_countDown();
}

var g_v_style;
function switchDarkMode(){
    if(g_v_style === undefined){
         g_v_style = insertStyle(`
                * {
                    background-color: #2f2f2f !important;
                    color: #c5c5c5 !important;
                }`);        
     }else{
        g_v_style.remove();
        g_v_style = undefined;
     }
}

function getDefaultModel(){
    return  $('#model-Always').prop("checked") ? $('#dropdown1 .active').attr('data-value') : 'normal';
}

function getImageUrl(uuid, model) {
    if (window.location.protocol == 'file:') {
        return '../figurosity/'+uuid+'/'+model + '/{offset}.jpg';
    }
    return 'https://love.figurosity.com/muses/' + uuid.substr(0, 2) + '/' + uuid.substr(2, 2) + '/' + uuid.substr(4, 2) + '/' + uuid + '/' + model + '/{size}/pose-{offset}.jpg';
}

var g_b_autoStart = true; // 是否在图片加载完毕后自动开始计时

function next_pose(start = false) {
    if(g_quickPose.length == {}) return;
    g_b_autoStart = start;
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
    var json = g_v_poses["id-" + id];
    g_v_showing = json;
    showUI("ui_viewer");
    loadId(json);

}

function reset_fitler() {
    $('.chips').each(function(index, el) {
        M.Chips.getInstance(el).chipsData = [];
    });
    $('.chips-placeholder').chips();
}

function showUI(id = '') {
    var back = id == '';
    if(back) id = g_s_ui_last;
    $('.container').each(function(index, el) {
        if (el.id == id) {
            $(el).removeClass('hide');
        } else {
            $(el).addClass('hide');
        }
    });
    if(back){
        g_s_ui_last = 'main';
        quickPose_end(); // 结束计时
    }
}

function prev_pose() {
    if(g_quickPose.length == {}) return;
    if (g_quickPose.index == 0) {
        // 到底了
        return;
    }
    loadIndex(--g_quickPose.index);
}

var g_v_showing; // 正在展示的json信息

function loadIndex(index) {
    $('#_index').html((index + 1) + '/' + g_quickPose.length);
    g_v_showing = g_quickPose[index];
    loadId(g_v_showing);
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
    if(typeof(json) !== 'object'){ // 本地数据
        json = {
            id: json,
            uuid: json
        };
    }          
    $('#_sec').html('<i class="material-icons">refresh</i>');
    g_v_viewing = {
        'data': json,
        'model': getDefaultModel(),
        'eyeLevel': 'Street'
    };
    g_v_cd.main = g_v_cd.default;
    // 读取预先随机生成的offset

    var offset = g_a_offsets["id-" + json.id] == undefined ? 0 : g_a_offsets["id-" + json.id];
    loadImage(json.id, json.uuid, offset, '', g_v_viewing.model);
    // {"id":5,"name":"Mei Lin","slug":"mei-lin","machine_name":"mei-lin","gender_id":111}
    //model.name;	

                
    var arr1 = [], dom;
    if(json.states == undefined){ // 本地没有数据记录
        arr1 = ["normal", "nude", "muscle", "smooth"];
    }else{
        for(var d of json.states) arr1.push(d.type);
    }
    for(var skin of ["normal", "nude", "muscle", "smooth"]){
        dom = $('#dropdown1 li[data-value="'+skin+'"]');
        if(g_api.type != 'quick-pose' && arr1.indexOf(skin) === -1){
            // quickpose 只会返回一种模型,直接无视掉
            dom.hide();
        }else{
            dom.show();
        }
    }
}

function start_countDown() {
    g_v_cd.stop = false;
    stop(false);
}

function loadImage(id, uuid, offset='00', size='', model='normal') {
    if(size == '') size = g_config.image_size;

    setRotate(0);

    $('#range').val(parseInt(offset)).focus();
    if (g_v_favorites["id-" + id] !== undefined) {
        $('#favorite').html('favorite');
    } else {
        $('#favorite').html('favorite_border');
    }

    offset = getOffsetString(offset);
    var img = getImageUrl(uuid, model);
    var key = model + '-' + offset + '-' + size;
    if (g_a_preloadImages[id] !== undefined && g_a_preloadImages[id][key] !== undefined && g_a_preloadImages[id][key][1]) {
        // 已经预加载过
        $('._control ._title').html('');

        imageLoader($('#viewer img').attr('src', img.replace('{size}', size).replace('{offset}', offset)), function(){
            checkAutoStart();
        });
    } else {
        g_v_cd.stop = true // 先暂停
        if($('#pause').html() == 'play_arrow'){ // 倒计时中,没有人为暂停
            if (window.location.protocol !== 'file:') {
                 imageLoader($('#viewer img').attr('src', img.replace('{size}', 100).replace('{offset}', offset)), function(){
                    console.log('11');
                              g_v_cd.stop = false;
                        });     
            }
        }
        // 
        preloadImage_single(img.replace('{size}', size).replace('{offset}', offset));
    }
    if (g_v_viewing.thumbs == undefined && $('#autoload-thumbs').prop('checked')) { // 加载略缩图
        g_v_viewing.thumbs = true;
        // preload all images
        for (var i = 0; i <= 32; i++) {
            preloadImage(id, model + '-' + _s(i) + '-100', img.replace('{size}', 100).replace('{offset}', _s(i)));
           // preloadImage(id, model + '-' + _s(i) + '-' + size, img.replace('{size}', size).replace('{offset}', _s(i)));
        }
    }    
}

function getOffsetString(offset){
    return window.location.protocol == 'file:' ? parseInt(offset) : _s(offset);
}

// TODO
function imageLoader(dom, f) {
    dom.imagesLoaded().fail(function(instance) {
        console.log('加载失败');
        // instance.images[0].img.src = instance.images[0].src;
        // instance.images[0].src = ''; // 404
    }).done(function(instance) {
        instance.images[0].img.style.opacity = 1;
        //console.log('加载成功');
    }).always(function(instance) {
        $('#_sec-next').html('').addClass('hide');
        f();
    })
    // .progress(function(instace, image){
    //     console.log("progress");
    // });
}

function setModel(model) {
    if (model != g_v_viewing.model) {
        $('.active').removeClass('active');
        $('#dropdown1 li[data-value="'+model+'"]').addClass('active');

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
    g_v_viewing.offset = getOffsetString($('#range').val());
    initImage(thumb);
}

var g_api = {
    'type': '', // api类型
    'paramType': '', //参数类型
}

function _view(name) {
    g_s_ui_last = 'main';
    var f = function(){};
    g_api.type = name;
    switch (name) {
        case 'quick-pose':
            g_api.paramType = 'pose';
            f = function(){
                showUI('quick-pose');
            }
            break;

        case 'pose-search':
            g_api.paramType = 'pose';
            f = function(){
                showUI('pose-search');
                if (g_v_poses.length == 0) {
                    data_query('pose-search');
                }                
            }
            
            break;

        case 'favorites':
            g_api.paramType = 'favorites';
            f = function(){
                showUI('pose-favorites');
                data_query('pose-favorites');
            }
            break;        

        case 'dogs':
        case 'horses':
        case 'superhero-poses':
        case 'martial-arts-poses':
        case 'girls-with-guns-poses':
            if(window.location.protocol == 'file:') return alert('本地端暂不支持,可以在网页版查看!');
            g_api.paramType = 'Drawing references';
            f = function(){
                g_v_poseSearch[g_api.paramType]['slug'] = name;

                var d = $('#sets').attr('data-type', name);
                d.find('.-header img')[0].src = './images/'+name+'.jpg';
                d.find('.-cover_list').html('');
                data_query(name);
                showUI('sets');
            }
            break;    
    }
    g_v_poseSearch[g_api.paramType] = g_v_poseSearch_default[g_api.paramType]; // 重置参数
    f();
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
    g_b_autoStart = false; // 在调整的时候不自动开始计时
    $('#range').val(offset).focus();
    g_v_viewing.offset = offset;
    initImage();
}

var g_v_image_single = new Image();
g_v_image_single.onload = function() {
    // 图片加载完毕
    $('#viewer img').attr('src', this.src).css('opacity', 1);
    $('._control ._title').html('');
    setLoading(false);
    if($('#pause').html() == 'pause'){
        start_countDown();
    }
}

function checkAutoStart(){
 if(g_b_autoStart) {
        g_b_autoStart = false;
        start_countDown();
    }
}

function preloadImage_single(src) {
    g_v_image_single.src = src;
}

function stop(b) {
    if (g_v_timer.quick_pose === 0) return;

    if(b === undefined){
        g_v_cd.stop = !g_v_cd.stop;
    }else{
        g_v_cd.stop = b;
    }
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


function setLoading(b, title = 'cancel'){
     g_b_loading = b;
    if(b){
      hsycms.loading('loading', title);
  }else{
     hsycms.hideLoading('loading');
  }
}

var g_ajax; // 网络请求
function cancelLoading(){
    g_b_stopAjax = true;
    if(g_ajax !== undefined){
     g_ajax.fail();
     g_ajax = undefined;
    }
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
            // console.log('图像加载完毕');
           // checkAutoStart();
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

var g_i_current = 0;

function spturn(){
    g_i_current = 0;
    var d = $('#ui_viewer img');
    //d[0].style.transform = 'rotate(0deg)';
    d.toggleClass('mirrorRotateLevel');
}

function czturn(){
    g_i_current = 0;
    var d = $('#ui_viewer img');
    //d[0].style.transform = 'rotate(0deg)';
    d.toggleClass('mirrorRotateVertical');
}

function turnLeft(){
    g_i_current = (g_i_current-90)%360;
   setRotate(g_i_current);
}

function turnRight(){
    g_i_current = (g_i_current+90)%360;
   setRotate(g_i_current);
}

function setRotate(rotate){
    $('#ui_viewer img')
    .removeClass('mirrorRotateLevel')
    .removeClass('mirrorRotateVertical')
    [0].style.transform = 'rotate('+rotate+'deg)';    
}

function openModal(type){
    switch(type){
        case '#modal_setting':
            $('#Thumb-Image-Size option[value="'+g_config.thumb_size+'"]')[0].selected = true;
            $('#Image-Size option[value="'+g_config.image_size+'"]')[0].selected = true;
            $('#viewer-click-action option[value="'+g_config.viewer_on_click+'"]')[0].selected = true;
            $('#autoload-thumbs').prop("checked", g_config.autoloadThumbs);
            $('#dark-mode').prop("checked", g_config.dark_mode);
            break;

        default:
            return;
    }
    $('select').formSelect(); // 更新
    $(type).modal('open');
}
function applySetting(){
   g_config.thumb_size = $('#Thumb-Image-Size').val();
   g_config.image_size = $('#Image-Size').val();
   g_config.viewer_on_click = $('#viewer-click-action').val();
   g_config.autoloadThumbs = $('#autoload-thumbs').prop('checked');
   g_config.dark_mode = $('#dark-mode').prop('checked');
   local_saveJson('config', g_config);
}