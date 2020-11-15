
function _s(s){
    s = parseInt(s);
    return s<10 ?'0' + s : s;
}

function _s1(s, j = ''){
    s = parseInt(s);
    return (s == 0 ? '' : (s<10 ? '0'+s : s) + j) ;
}

function getTimeString(s){
    s = Number(s);
    var h = 0, m = 0;
    if(s >= 3600){
        h = parseInt(s / 3600);
        s %= 3600;
    }
    if(s >= 60){
        m = parseInt(s / 60);
        s %= 60;
    }
    return _s1(h, ':')+_s1(m, ':')+_s1(s);
}

function getGETArray() {
    var a_result = [], a_exp;
    var a_params = window.location.search.slice(1).split('&');
    for (var k in a_params) {
        a_exp = a_params[k].split('=');
        if (a_exp.length > 1) {
            a_result[a_exp[0]] = decodeURIComponent(a_exp[1]);
        }
    }
    return a_result;
}

function local_saveJson(key, data) {
    if (window.localStorage) {
        key = g_localKey + key;
        data = JSON.stringify(data);
        if(data == undefined) data = '[]';
        return localStorage.setItem(key, data);
    }
    return false;
}

function local_readJson(key, defaul = '') {
    if(!window.localStorage) return defaul;
    key = g_localKey + key;
    var r = JSON.parse(localStorage.getItem(key));
    return r === null ? defaul : r;
}

function getLocalItem(key, defaul = '') {
    var r = null;
    if(window.localStorage){
        r = localStorage.getItem(g_localKey + key);
    }
    return r === null ? defaul : r;
}

function setLocalItem(key, value) {
    if(window.localStorage){
       return localStorage.setItem(g_localKey + key, value);
    }
    return false;
}

function randNum(min, max){
    return parseInt(Math.random()*(max-min+1)+min,10);
}

//打乱数组
function shuffle(arr, max = 100){
    var res = [];
    let _arr = arr.slice();
    var max1 = _arr.length;
    if(max > max1) max = max1;
    for (let i = 0; i<max; i++){
        let j = randNum(0,max1);
        res.push(_arr[j]);
        _arr.splice(j, 1);
        max1--;
    }
    return res;
}

function insertStyle(cssText) {
    var head = document.getElementsByTagName("head")[0];
    var style = document.createElement("style");
    var rules = document.createTextNode(cssText);
    style.type = "text/css";
    if (style.styleSheet) {
        style.styleSheet.cssText = rules.nodeValue;
    } else {
        style.appendChild(rules);
    }
    head.appendChild(style);
    return style;
}

