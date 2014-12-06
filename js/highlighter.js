
// 하이라이터 함수를 엘리머트 객체의 프로토타입으로 등록.(IE8 이상부터 지원.)
// oOption = {
//     serializeBtn : serialize 버튼의 ID 값,
//     resetBtn : reset 버튼의 ID 값,
//     deserializeBtn : deserialize 버튼의 ID 값,
//     textarea : textarea의 ID값.(텍스트를 임시저장 하기위해),
//     colour : higoHlighter color(기본값 #F6F94A),
//     article : 하이라이팅 적용 오브젝트,
//     forwardClass : 포워드시 적용할 클래스,
//     backwardClass : 백워드시 적용할 클래스
// }
Element.prototype.highlighter = function (oOption) {
    if (!oOption) {
        oOption = {
            elArticle : this
        };
    } else {
        oOption.elArticle = this;
    };

    var oHl = new highlighter(oOption);

    this.addEventListener('mousedown', oHl.getEvent, false);
    this.addEventListener('mousemove', oHl.getEvent, false);
    this.addEventListener('mouseup', oHl.getEvent, false);

    if (oOption.resetBtn) {
        document.getElementById(oOption.resetBtn).addEventListener('click', oHl.resetHighLight, false);
    };

    if (oOption.textarea) {
        var elTextarea = document.getElementById(oOption.textarea);
        oHl.setTextarea(elTextarea);
    };

    if (oOption.serializeBtn) {
        document.getElementById(oOption.serializeBtn).addEventListener('click', oHl.clickSerialize, false);
    };

    if (oOption.deserializeBtn) {
        document.getElementById(oOption.deserializeBtn).addEventListener('click', oHl.clickDeserialize, false);
    };
};

// 내장함수들.
$$ = {};

var highlighter = function (oOption) {
    // 하이라이터 오브젝트
    var oHl = this;
    // 하이라이팅 대상 오브젝트
    var elArticle = oOption.elArticle;
    // 하이라이팅 색깔
    var colour = oOption.colour;
    // 포워드 백워드 클래스
    var forwardClass = oOption.forwardClass || "";
    var backwardClass = oOption.backwardClass || "";
    // 포지션
    var startX, startY, endX, endY;
    var rectTop;
    // 그외 유지하는 정보
    this.elTextarea;
    this.forward = false;
    this.started = false;

    if (!colour) {
        colour = '#F6F94A';
    };

    this.getEvent = function (ev) {
        var func = oHl[ev.type];
        if(func) {
            func(ev);
        }
    };

    this.mousedown = function (ev) {
        startX = ev.x;
        startY = ev.y;
        oHl.started = true;
    };

    this.mousemove = function (ev) {
        if (oHl.started) {
            var sel, range, rect;
            if(!rectTop) {
                sel = window.getSelection();
                range = sel.getRangeAt(0);
                rect = range.getClientRects()[0];
                rectTop = rect.top;
            }
            
            endX = ev.x;
            endY = ev.y;

            if (oHl.isForward()) {
                oHl.mouseforward();
            } else {
                oHl.mousebackward();
            };
        };
    };

    this.setTextarea = function (elTextarea) {
        this.elTextarea = elTextarea;
    }

    this.isForward = function () {
        var fontSize = parseInt(document.defaultView.getComputedStyle(elArticle).fontSize, 10);
        if (startX < endX) {
            if (rectTop-(fontSize-1) < endY) {
                return true;
            } else{
                return false;
            };
        } else {
            if (rectTop+(fontSize-1) < endY) {
                return true;
            } else{
                return false;
            };
        };
    };

    this.mouseup = function (ev) {
        var sel;

        if (oHl.forward) {
            oHl.highlightSelection(colour);
        } else{
            oHl.highlightSelection("transparent");
        };

        sel = window.getSelection();
        sel.removeAllRanges();

        $$.removeClass(elArticle, backwardClass);
        $$.removeClass(elArticle, forwardClass);
        rectTop = null;
        oHl.started = false;
    };

    this.mouseforward = function () {
        oHl.forward = true;
        $$.removeClass(elArticle, backwardClass);
        $$.addClass(elArticle, forwardClass);
    };

    this.mousebackward = function () {
        oHl.forward = false;
        $$.removeClass(elArticle, forwardClass);
        $$.addClass(elArticle, backwardClass);
    };

    this.makeEditableAndHighlight = function (colour) {
        var range, sel = window.getSelection();
        if (sel.rangeCount && sel.getRangeAt) {
            range = sel.getRangeAt(0);
        }
        document.designMode = "on";
        if (range) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
        // Use HiliteColor since some browsers apply BackColor to the whole block
        if (!document.execCommand("HiliteColor", false, colour)) {
            document.execCommand("BackColor", false, colour);
        };

        sel.removeAllRanges();
        document.designMode = "off";
    };

    this.highlightSelection = function (colour) {
        var range, sel;
        if (window.getSelection) {
            // IE9 and non-IE
            try {
                if (!document.execCommand("BackColor", false, colour)) {
                    this.makeEditableAndHiight(colour);
                }
            } catch (ex) {
                this.makeEditableAndHighlight(colour)
            }
        } else if (document.selection && document.selection.createRange) {
            // IE <= 8 case
            range = document.selection.createRange();
            range.execCommand("BackColor", false, colour);
        }
    };

    this.resetHighLight = function (ev) {
        ev.preventDefault();

        var ahighlights = document.querySelectorAll("span[style^='background-color: rgb']");

        for (var i = 0, length = ahighlights.length; i < length ; i++) {
            ahighlights[i].style.backgroundColor = 'transparent';
        }

        oHl.elTextarea.textContent = "";
    };

    this.serialize = function () {
        var oData = {};
        var aSerialized = [];
        elArticle.innerHTML = elArticle.innerHTML.replace(/[\f\n\r\t\v]/g,"  ");
        var highlights = document.querySelectorAll("span[style^='background-color: rgb']");
        for (var i = 0, length = highlights.length; i < length; i++) {
            var oEle = {};
            var ele = highlights[i];
            var temp = oHl.getTempSpan();
            ele.parentNode.insertBefore(temp, ele);

            oEle.color = ele.style.backgroundColor;
            oEle.start = elArticle.textContent.indexOf('@#$@#$!!');
            oEle.text = [];

            for (var k = 0, klength = ele.childNodes.length; k < klength; k++) {
                var textContent = ele.childNodes[k].textContent;
                var aTextContent = textContent.split(/[\f\n\r\t\v]/g);
                for (var j = 0, jlength = aTextContent.length; j < jlength; j++) {
                    if(aTextContent[j].length >= 1) {
                        oEle.text.push(aTextContent[j]);
                    } else {
                        if (k == 0) {
                            oEle.start++;
                        };
                    }
                };

            };

            aSerialized.push(oEle);
            // Remove temp span.
            document.querySelector('.fingqooq-hidden').remove();
        };

        return JSON.stringify(aSerialized);
    };

    this.clickSerialize = function (ev) {
        ev.preventDefault();
        oHl.elTextarea.textContent = "";
        oHl.elTextarea.textContent = oHl.serialize();
    };

    this.deserialize = function (aSerialized) {
        elArticle.innerHTML = elArticle.innerHTML.replace(/[\f\n\r\t\v]/g," ");
        for (var i = 0, length = aSerialized.length; i < length; i++) {
            var oEle = aSerialized[i];
            var pos = 0, count = 0;

            while(oEle.start != elArticle.textContent.indexOf(oEle.text[0], pos)) {
                pos = elArticle.textContent.indexOf(oEle.text[0], pos)+1;
                count++;
            };

            pos = 0;
            for (var j = 0; j < count; j++) {
                pos = elArticle.innerHTML.indexOf(oEle.text[0], pos);
                pos++;
            };

            for (var k = 0, klength = oEle.text.length; k < klength; k++) {
                var text = oEle.text[k];
                elArticle.innerHTML = elArticle.innerHTML.substring(0, pos)
                                    + elArticle.innerHTML.substring(pos).replace(text, "<span style='background-color: " + oEle.color + "'>" + text + "</span>");
            };
        };
    };

    this.clickDeserialize = function (ev) {
        ev.preventDefault();
        var aSerialized = JSON.parse(oHl.elTextarea.value);
        oHl.deserialize(aSerialized);
    };

    this.getTempSpan = function () {
        var elTempSpan = document.createElement('span');
        elTempSpan.textContent = "@#$@#$!!";
        $$.addClass(elTempSpan, 'fingqooq-hidden');

        return elTempSpan;
    };
}

// Element를 찾아서 DOM을 반환하는 함수.
// param : name
$$.getByName = function (param) {
    return document.getElementsByName(param)[0];
};

// Element를 찾아서 DOM을 반환하는 함수.
// param : id
$$.getById = function (param) {
    return document.getElementById(param);
};

// Info Object를 받아 ajax요청을 하는 함수, 내부에서 함수를 실행하거나 리턴함수로 넘겨줌
// oInfo = {
//  method : 요청 method(String),
//  url : 요청 url(String),
//  async : 비동기 - true, 동기 - false,
//  content : Content type,
//  sendData : 보낼 데이터, 기본값 null,
//  success : 성공시 실행되는 함수,
//  error : 에러시 실행되는 함수
// }
$$.ajax = function (oInfo) {
    var xhr, sendData;
    // code for IE7+, Firefox, Chrome, Opera, Safari
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    // code for IE6, IE5
    } else {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    };

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var responseText = xhr.responseText;
            oInfo.success(responseText);
        } else {
            if (oInfo.error) {
                oInfo.error();
            };
        }
    };

    xhr.open(oInfo.method, oInfo.url, oInfo.async);
    xhr.setRequestHeader("Content-Type", oInfo.content);

    sendData = oInfo.sendData || null;
    xhr.send(sendData);
};

// Dom의 class를 toggle하는 함수
$$.toggleClass = function (dom, className) {
    if (this.hasClass(dom, className)) {
        dom.classList.remove(className);
    } else {
        dom.classList.add(className);
    };
};

// Dom의 class가 없으면 추가하는 함수
$$.addClass = function (dom, className) {
    dom.classList.add(className);
};

// Dom의 class가 있으면 빼는 함수
$$.removeClass = function (dom, className) {
    dom.classList.remove(className);
};

// Dom이 className이 있으면 true, 없으면 false를 반환하는 함수
$$.hasClass = function (dom, className) {
    for (var i = 0; i < dom.classList.length; i++) {
        if (dom.classList[i] == className) {
            return true;
        };
    };

    return false;
};
