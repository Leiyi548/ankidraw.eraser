var visible = /*VISIBILITY_PLACEHOLDER*/;
var perfectFreehand = /*PERFECT_FREEHAND_PLACEHOLDER*/;
var canvas = document.getElementById('main_canvas');
var wrapper = document.getElementById('canvas_wrapper');
var optionBar = document.getElementById('pencil_button_bar');
var ts_undo_button = document.getElementById('ts_undo_button');
var ctx = canvas.getContext('2d');
var secondary_canvas = document.getElementById('secondary_canvas');
var secondary_ctx = secondary_canvas.getContext('2d');
var ts_visibility_button = document.getElementById('ts_visibility_button');
var ts_kanji_button = document.getElementById('ts_kanji_button');
var ts_perfect_freehand_button = document.getElementById('ts_perfect_freehand_button');
var ts_switch_fullscreen_button = document.getElementById('ts_switch_fullscreen_button');
var arrays_of_points = [];
var convertDotStrokes = /*CONVERT_DOT_STROKES_PLACEHOLDER*/;
var color = '#fff';
var calligraphy = /*CALLIGRAPHY_PLACEHOLDER*/;
var line_type_history = [];
var perfect_cache = [];
var line_width = 4;
var small_canvas = /*SMALL_CANVAS_PLACEHOLDER*/;
var fullscreen_follow = /*FOLLOW_PLACEHOLDER*/;
var lineMode = false;
var startPoint = null;

// 表示当前正在处理笔迹数据的保存或加载，防止重复操作
var isProcessingStrokeData = false;
// 存储当前卡片ID
var currentCardId = '';
// 标记是否发生了笔迹变化，用于决定是否需要保存
var strokesChanged = false;
// 防抖计时器ID，用于延迟保存操作
var saveDebounceTimer = null;
// 跟踪当前是否正面笔迹模式
var isQuestionSide = true; // 默认为正面

// 表示是否使用Surface Pen笔端擦除模式
var isPenEraserActive = false;

// 表示是否使用Surface Pen侧键激活橡皮擦模式
var isSidePenButtonEraser = false;
// 保存侧键激活橡皮擦之前的工具状态
var previousToolState = {
    perfectFreehand: false,
    calligraphy: false,
    lineMode: false,
    rectangleMode: false,
    eraserMode: false
};

// 直线工具专用属性
var lineColor = '#fff'; // 直线颜色，默认与普通画笔相同
var lineWidth = 4; // 直线线宽，默认与普通画笔相同

// 矩形工具专用属性
var rectangleMode = false;
var rectangleColor = '#fff'; // 矩形颜色，默认与普通画笔相同
var rectangleWidth = 4; // 矩形线宽，默认与普通画笔相同
var isDrawingRect = false; // 是否正在绘制矩形
var rectStartX = 0; // 矩形起始X坐标
var rectStartY = 0; // 矩形起始Y坐标

// 添加存储被擦除笔画的数组
var erasedStrokes = [];
var erasedPerfectCache = [];
var erasedLineTypeHistory = [];

// 直线样式相关变量
var lineStyle = 'solid'; // 直线样式：solid(实线)、dashed(虚线)、wavy(波浪线)
var lineDashPattern = []; // 虚线模式
var lineStyleSlider = null; // 直线样式选择器
var lineStyleSliderTimeout = null; // 直线样式选择器隐藏计时器

canvas.onselectstart = function () { return false; };
secondary_canvas.onselectstart = function () { return false; };
wrapper.onselectstart = function () { return false; };

function switch_perfect_freehand() {
    // 功能已禁用
    perfectFreehand = false;
    ts_perfect_freehand_button.className = '';
    ts_redraw()
}

function switch_small_canvas() {
    stop_drawing();

    small_canvas = !small_canvas;
    if (!small_canvas) {
        ts_switch_fullscreen_button.className = 'active';
    }
    else {
        ts_switch_fullscreen_button.className = '';
    }
    resize();
}

function switch_visibility() {
    stop_drawing();

    // Add debug logs to console
    console.log("Before toggle - visible:", visible);
    console.log("Before toggle - optionBar.className:", optionBar.className);

    if (visible) {
        // Hide canvas
        canvas.style.display = 'none';
        secondary_canvas.style.display = canvas.style.display;
        ts_visibility_button.className = '';

        // Force toolbar to collapse - explicitly set all other buttons to none
        optionBar.className = 'touch_disable';

        // Make sure all buttons except the first one are hidden
        var buttons = optionBar.querySelectorAll('button:not(:first-child)');
        // 改变第一按钮的svg
        var firstButton = optionBar.querySelector('button:first-child');
        var openEyeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        openEyeSvg.setAttribute("viewBox", "0 0 1024 1024");
        openEyeSvg.setAttribute("width", "200");
        openEyeSvg.setAttribute("height", "200");

        var path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path1.setAttribute("d", "M512 643.134694c-72.097959 0-131.134694-58.514286-131.134694-131.134694S439.902041 380.865306 512 380.865306s131.134694 58.514286 131.134694 131.134694-59.036735 131.134694-131.134694 131.134694z m0-220.47347c-49.110204 0-89.338776 40.228571-89.338776 89.338776s40.228571 89.338776 89.338776 89.338776 89.338776-40.228571 89.338776-89.338776-40.228571-89.338776-89.338776-89.338776z");
        path1.setAttribute("fill", "#333333");

        var path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path2.setAttribute("d", "M512 780.538776c-173.97551 0-321.828571-131.134694-394.44898-208.979592-30.82449-33.436735-30.82449-85.159184 0-118.595919 72.620408-77.844898 220.473469-208.979592 394.44898-208.979592s321.828571 131.134694 394.44898 208.979592c30.82449 33.436735 30.82449 85.159184 0 118.595919-72.620408 77.844898-220.473469 208.979592-394.44898 208.979592z m0-495.281633c-158.302041 0-295.706122 122.77551-364.146939 195.918367-16.195918 17.240816-16.195918 44.408163 0 61.64898 67.918367 73.142857 205.844898 195.918367 364.146939 195.918367s295.706122-122.77551 364.146939-195.918367c16.195918-17.240816 16.195918-44.408163 0-61.64898-68.440816-73.142857-205.844898-195.918367-364.146939-195.918367z");
        path2.setAttribute("fill", "#333333");

        openEyeSvg.appendChild(path1);
        openEyeSvg.appendChild(path2);
        firstButton.innerHTML = ''; // 清空原有内容
        firstButton.appendChild(openEyeSvg);

        buttons.forEach(function (btn) {
            btn.dataset.originalDisplay = btn.style.display;
            btn.style.display = 'none';
        });

        // Force the toolbar to update its class immediately
        setTimeout(function () {
            console.log("After hide - optionBar.className:", optionBar.className);
        }, 10);
    }
    else {
        // Show canvas
        canvas.style.display = 'block';
        secondary_canvas.style.display = canvas.style.display;
        ts_visibility_button.className = 'active';

        // Restore toolbar to expanded state
        optionBar.className = '';

        // Restore all buttons to their original display state
        var buttons = optionBar.querySelectorAll('button:not(:first-child)');
        buttons.forEach(function (btn) {
            btn.style.display = btn.dataset.originalDisplay || '';
        });

        // 恢复第一按钮的svg
        var firstButton = optionBar.querySelector('button:first-child');
        // 创建闭眼SVG元素
        var closeEyeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        closeEyeSvg.setAttribute("viewBox", "0 0 1024 1024");
        closeEyeSvg.setAttribute("width", "200");
        closeEyeSvg.setAttribute("height", "200");

        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M332.8 729.6l34.133333-34.133333c42.666667 12.8 93.866667 21.333333 145.066667 21.333333 162.133333 0 285.866667-68.266667 375.466667-213.333333-46.933333-72.533333-102.4-128-166.4-162.133334l29.866666-29.866666c72.533333 42.666667 132.266667 106.666667 183.466667 192-98.133333 170.666667-243.2 256-426.666667 256-59.733333 4.266667-119.466667-8.533333-174.933333-29.866667z m-115.2-64c-51.2-38.4-93.866667-93.866667-132.266667-157.866667 98.133333-170.666667 243.2-256 426.666667-256 38.4 0 76.8 4.266667 110.933333 12.8l-34.133333 34.133334c-25.6-4.266667-46.933333-4.266667-76.8-4.266667-162.133333 0-285.866667 68.266667-375.466667 213.333333 34.133333 51.2 72.533333 93.866667 115.2 128l-34.133333 29.866667z m230.4-46.933333l29.866667-29.866667c8.533333 4.266667 21.333333 4.266667 29.866666 4.266667 46.933333 0 85.333333-38.4 85.333334-85.333334 0-12.8 0-21.333333-4.266667-29.866666l29.866667-29.866667c12.8 17.066667 17.066667 38.4 17.066666 64 0 72.533333-55.466667 128-128 128-17.066667-4.266667-38.4-12.8-59.733333-21.333333zM384 499.2c4.266667-68.266667 55.466667-119.466667 123.733333-123.733333 0 4.266667-123.733333 123.733333-123.733333 123.733333zM733.866667 213.333333l29.866666 29.866667-512 512-34.133333-29.866667L733.866667 213.333333z");
        path.setAttribute("fill", "#444444");

        closeEyeSvg.appendChild(path);
        firstButton.innerHTML = ''; // 清空原有内容
        firstButton.appendChild(closeEyeSvg);


        // Force the toolbar to update its class immediately
        setTimeout(function () {
            console.log("After show - optionBar.className:", optionBar.className);
        }, 10);
    }
    visible = !visible;

    // Add final debug log
    console.log("After toggle - visible:", visible);
    console.log("After toggle - optionBar.className:", optionBar.className);
}

//Initialize event listeners at the start;
// 使用options参数设置passive为false，这允许我们在事件处理函数中根据条件决定是否阻止默认行为
canvas.addEventListener("pointerdown", pointerDownLine, { passive: false });
canvas.addEventListener("pointermove", pointerMoveLine, { passive: false });
window.addEventListener("pointerup", pointerUpLine, { passive: false });
canvas.addEventListener("pointerdown", pointerDownCaligraphy, { passive: false });
canvas.addEventListener("pointermove", pointerMoveCaligraphy, { passive: false });
window.addEventListener("pointerup", pointerUpCaligraphy, { passive: false });

// 添加Surface Pen笔端擦除事件
canvas.addEventListener("pointerdown", handlePenEraser, { passive: false });
canvas.addEventListener("pointermove", handlePenEraserMove, { passive: false });
window.addEventListener("pointerup", stopPenEraser, { passive: false });

function switch_drawing_mode() {
    var ts_write_button = document.getElementById('ts_write_button');
    // 切换active状态
    if (ts_write_button.className.includes('active')) {
        ts_write_button.className = ts_write_button.className.replace(/\bactive\b/g, '');
    } else {
        // 禁用矩形模式
        rectangleMode = false
        document.getElementById('ts_rectangle_button').className = '';
        // 移除矩形工具的事件监听器
        if (typeof pointerDownRectangle === 'function') {
            canvas.removeEventListener('pointerdown', pointerDownRectangle);
            canvas.removeEventListener('pointermove', pointerMoveRectangle);
            window.removeEventListener('pointerup', pointerUpRectangle);
        }
        // 禁用直线模式
        lineMode = false
        document.getElementById('ts_line_button').className = '';
        // 禁用像皮擦
        if (eraserMode) {
            toggleEraser(false);
        }
        ts_write_button.className += ' active';
    }
}

function switch_class(e, c) {
    var reg = new RegExp('(\\\s|^)' + c + '(\\s|$)');
    if (e.className.match(new RegExp('(\\s|^)' + c + '(\\s|$)'))) {
        e.className = e.className.replace(reg, '');
    }
    else {
        e.className += c;
    }
}
function resize() {
    var card = document.getElementsByClassName('card')[0];

    // Run again until card is loaded
    if (!card) {
        window.setTimeout(resize, 100);
        return;
    }

    // Check size of page without canvas
    canvas_wrapper.style.display = 'none';
    canvas.style["border-style"] = "none";
    document.documentElement.style.setProperty('--canvas-bar-pt', '0px');
    document.documentElement.style.setProperty('--canvas-bar-pr', '0px');
    document.documentElement.style.setProperty('--canvas-bar-pb', 'unset');
    document.documentElement.style.setProperty('--canvas-bar-pl', 'unset');
    document.documentElement.style.setProperty('--canvas-bar-position', 'absolute');

    // 获取实际的窗口高度，包括所有内容
    var totalHeight = Math.max(
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight,
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.body.clientHeight,
        card.scrollHeight,
        card.offsetHeight
    );

    // 获取实际的窗口宽度
    var totalWidth = Math.max(
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth,
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.body.clientWidth,
        card.scrollWidth,
        card.offsetWidth
    );

    if (!small_canvas && !fullscreen_follow) {
        ctx.canvas.width = totalWidth;
        ctx.canvas.height = totalHeight;
    } else if (small_canvas) {
        ctx.canvas.width = Math.min(totalWidth,
            parseInt(getComputedStyle(document.documentElement).getPropertyValue('--small-canvas-width')));
        ctx.canvas.height = Math.min(totalHeight,
            parseInt(getComputedStyle(document.documentElement).getPropertyValue('--small-canvas-height')));
        canvas.style["border-style"] = "dashed";
        document.documentElement.style.setProperty('--canvas-bar-pt',
            getComputedStyle(document.documentElement).getPropertyValue('--button-bar-pt'));
        document.documentElement.style.setProperty('--canvas-bar-pr',
            getComputedStyle(document.documentElement).getPropertyValue('--button-bar-pr'));
        document.documentElement.style.setProperty('--canvas-bar-pb',
            getComputedStyle(document.documentElement).getPropertyValue('--button-bar-pb'));
        document.documentElement.style.setProperty('--canvas-bar-pl',
            getComputedStyle(document.documentElement).getPropertyValue('--button-bar-pl'));
        document.documentElement.style.setProperty('--canvas-bar-position', 'fixed');
    } else {
        document.documentElement.style.setProperty('--canvas-bar-position', 'fixed');
        ctx.canvas.width = totalWidth - 1;
        ctx.canvas.height = totalHeight - 1;
    }

    secondary_ctx.canvas.width = ctx.canvas.width;
    secondary_ctx.canvas.height = ctx.canvas.height;
    canvas_wrapper.style.display = 'block';

    /* Get DPR with 1 as fallback */
    var dpr = window.devicePixelRatio || 1;

    /* CSS size is the same */
    canvas.style.height = ctx.canvas.height + 'px';
    wrapper.style.width = ctx.canvas.width + 'px';
    secondary_canvas.style.height = canvas.style.height;
    secondary_canvas.style.width = canvas.style.width;

    /* Increase DOM size and scale */
    ctx.canvas.width *= dpr;
    ctx.canvas.height *= dpr;
    ctx.scale(dpr, dpr);
    secondary_ctx.canvas.width *= dpr;
    secondary_ctx.canvas.height *= dpr;
    secondary_ctx.scale(dpr, dpr);

    update_pen_settings();

    // 添加调试日志
    console.log('AnkiDraw Debug: 画布大小已更新',
        'width:', ctx.canvas.width / dpr,
        'height:', ctx.canvas.height / dpr,
        'totalWidth:', totalWidth,
        'totalHeight:', totalHeight,
        'window.innerWidth:', window.innerWidth,
        'window.innerHeight:', window.innerHeight,
        'document.documentElement.scrollHeight:', document.documentElement.scrollHeight,
        'document.body.scrollHeight:', document.body.scrollHeight,
        'card.scrollHeight:', card.scrollHeight);
}


window.addEventListener('resize', resize);
window.addEventListener('load', resize);
window.requestAnimationFrame(draw_last_line_segment);

// 添加键盘快捷键支持
document.addEventListener('keydown', function (e) {
    if (e.altKey) {
        switch (e.key.toLowerCase()) {
            case 'l':
                switch_line_mode();
                break;
        }
    }
});

var isPointerDown = false;
var mouseX = 0;
var mouseY = 0;

function update_pen_settings() {
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.lineWidth = line_width;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    secondary_ctx.lineJoin = ctx.lineJoin;
    secondary_ctx.lineWidth = ctx.lineWidth;
    secondary_ctx.strokeStyle = ctx.strokeStyle;
    secondary_ctx.fillStyle = ctx.fillStyle;
    ts_redraw()
}

// 专门更新直线工具的设置
function update_line_settings() {
    secondary_ctx.lineJoin = 'round';
    secondary_ctx.lineCap = 'round';
    secondary_ctx.lineWidth = lineWidth; // 使用直线专用的线宽
    secondary_ctx.strokeStyle = lineColor; // 使用直线专用的颜色
    secondary_ctx.fillStyle = lineColor;

    // 根据直线样式设置不同的样式
    if (lineStyle === 'dashed' && lineDashPattern.length > 0) {
        // 设置虚线模式
        secondary_ctx.setLineDash(lineDashPattern);
    } else {
        // 清除虚线模式，用于实线
        secondary_ctx.setLineDash([]);
    }
}

// 在文件顶部添加全局变量以跟踪笔迹和窗口大小状态
var strokeOperation = ''; // 记录最近的操作类型：'A'=添加，'E'=擦除，'U'=撤销
var lastWindowSize = { width: 0, height: 0 }; // 记录最后保存的窗口大小

function ts_undo() {
    if (!line_type_history.length) return;

    var lastOperation = line_type_history.pop();
    console.log('AnkiDraw Debug: 撤销操作，类型:', lastOperation);

    // 设置操作类型为撤销
    strokeOperation = 'U';

    switch (lastOperation) {
        case 'E': // 擦除操作
            var lastErased = erasedStrokes.pop();
            if (lastErased) {
                if (lastErased.lineType === 'C') {
                    // 恢复书法笔画
                    strokes.splice(lastErased.index, 0, lastErased.calligraphyStroke);
                } else {
                    // 恢复普通笔画
                    arrays_of_points.splice(lastErased.index, 0, lastErased.points);
                    perfect_cache.splice(lastErased.index, 0, lastErased.perfectCache);
                    line_type_history.splice(lastErased.index, 0, lastErased.lineType);
                }
            }
            break;
        case 'C': //Calligraphy
            strokes.pop();
            break;
        case 'L': //Simple Lines
        case 'R': //Rectangle
            var index = arrays_of_points.length - 1;
            arrays_of_points.pop();
            perfect_cache[index] = null;
            break;
        default:
            if (arrays_of_points.length > 0) {
                arrays_of_points.pop();
                perfect_cache.pop();
            }
            break;
    }

    if (!line_type_history.length) {
        clear_canvas();
        ts_undo_button.className = "";
    } else {
        ts_redraw();

        // 标记笔迹已变化，但不保存窗口大小
        strokesChanged = true;
        save_strokes_debounced();
    }
}

function ts_redraw() {
    pleaseRedrawEverything = true;
}

function ts_clear() {
    pleaseRedrawEverything = true;
    fullClear = true;
}

function clear_canvas() {
    //don't continue to put points into an empty array(pointermove) if clearing while drawing on the canvas
    stop_drawing();
    arrays_of_points = [];
    strokes = [];
    perfect_cache = [];
    line_type_history = [];
    ts_clear();

    // 标记笔迹已变化并保存（清空）
    strokesChanged = true;
    save_strokes_debounced();
}

function stop_drawing() {
    // 清除所有待处理的笔触计时器
    if (pendingPenStrokeTimer) {
        clearTimeout(pendingPenStrokeTimer);
        pendingPenStroke = null;
    }

    if (pendingCalligraphyTimer) {
        clearTimeout(pendingCalligraphyTimer);
        pendingCalligraphyStroke = null;
    }

    isPointerDown = false;
}

function start_drawing() {
    ts_undo_button.className = "active"
    isPointerDown = true;
}

function draw_last_line_segment() {
    window.requestAnimationFrame(draw_last_line_segment);
    draw_upto_latest_point_async(nextLine, nextPoint, nextStroke);
}

var nextLine = 0;
var nextPoint = 0;
var nextStroke = 0;
var p1, p2, p3;

function is_last_path_and_currently_drawn(i) {
    return (isPointerDown && arrays_of_points.length - 1 == i)//the path is complete unless its the last of the array and the pointer is still down
}

function all_drawing_finished(i) {
    return (!isPointerDown && arrays_of_points.length - 1 == i)//the path is complete unless its the last of the array and the pointer is still down
}

async function draw_path_at_some_point_async(startX, startY, midX, midY, endX, endY, lineWidth) {
    ctx.beginPath();
    ctx.moveTo((startX + (midX - startX) / 2), (startY + (midY - startY) / 2));//midpoint calculation for x and y
    ctx.quadraticCurveTo(midX, midY, (midX + (endX - midX) / 2), (midY + (endY - midY) / 2));
    ctx.lineWidth = lineWidth;
    ctx.stroke();
};

var pleaseRedrawEverything = false;
var fullClear = false;
async function draw_upto_latest_point_async(startLine, startPoint, startStroke) {
    //Don't keep redrawing the same last point over and over
    //if(!pleaseRedrawEverything && 
    //(startLine == arrays_of_points.length && startPoint == arrays_of_points[startLine-1].length) && 
    //(startStroke == strokes.length)) return;

    var fullRedraw = false;//keep track if this call started a full redraw to unset pleaseRedrawEverything flag later.
    if (pleaseRedrawEverything) {// erase everything and draw from start
        fullRedraw = true;
        startLine = 0;
        startPoint = 0;
        startStroke = 0;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    for (var i = startLine; i < arrays_of_points.length; i++) { //Draw Lines
        var needPerfectDraw = false;
        nextLine = i;

        // 处理直线工具创建的线(只有两个点)
        if (arrays_of_points[i].length === 2) {
            var p1 = arrays_of_points[i][0];
            var p2 = arrays_of_points[i][1];

            if (!perfectFreehand) {
                // 使用存储的直线颜色和线宽
                ctx.lineWidth = p1[3] || line_width; // 使用点中存储的线宽，如果没有则使用默认值
                ctx.strokeStyle = p1[2] || color; // 使用点中存储的颜色，如果没有则使用默认值

                // 获取样式信息
                var styleInfo = p1[4] || { style: 'solid', dashPattern: [] };

                // 检查是否为矩形
                if (styleInfo.style === 'rectangle') {
                    // 绘制矩形
                    ctx.save();
                    ctx.setLineDash([]); // 矩形使用实线
                    ctx.beginPath();
                    ctx.rect(
                        p1[0], // 左上角 x
                        p1[1], // 左上角 y
                        p2[0] - p1[0], // 宽度
                        p2[1] - p1[1]  // 高度
                    );
                    ctx.stroke();
                    ctx.restore();
                }
                // 处理波浪线
                else if (styleInfo.style === 'wavy') {
                    // 绘制波浪线，使用存储的颜色和线宽
                    ctx.save();
                    drawWavyLine(ctx, p1[0], p1[1], p2[0], p2[1], 2, 2, p1[2], p1[3]);
                    ctx.restore();
                } else {
                    // 设置虚线样式
                    if (styleInfo.style === 'dashed' && styleInfo.dashPattern.length > 0) {
                        ctx.setLineDash(styleInfo.dashPattern);
                    } else {
                        ctx.setLineDash([]);
                    }

                    // 绘制普通直线或虚线
                    ctx.beginPath();
                    ctx.moveTo(p1[0], p1[1]);
                    ctx.lineTo(p2[0], p2[1]);
                    ctx.stroke();

                    // 重置虚线设置，避免影响其他绘制
                    ctx.setLineDash([]);
                }
            } else {
                needPerfectDraw = true;
            }
        }
        // 处理普通绘制的线(多个点)
        else {
            ///0,0,0; 0,0,1; 0,1,2 or x+1,x+2,x+3
            //take the 2 previous points in addition to current one at the start of the loop.
            p2 = arrays_of_points[i][startPoint > 1 ? startPoint - 2 : 0];
            p3 = arrays_of_points[i][startPoint > 0 ? startPoint - 1 : 0];
            for (var j = startPoint; j < arrays_of_points[i].length; j++) {
                nextPoint = j + 1;//track which point was last drawn so we can pick up where we left off on the next refresh.
                p1 = p2;
                p2 = p3;
                p3 = arrays_of_points[i][j];

                if (!perfectFreehand) {
                    // 使用点中存储的线宽和颜色
                    ctx.lineWidth = p3[3] || line_width;
                    ctx.strokeStyle = p3[2] || color;

                    draw_path_at_some_point_async(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], p3[3] || line_width);
                }
                else { needPerfectDraw = true; }
            }
        }

        if (needPerfectDraw) {
            var path = !perfect_cache[i] || is_last_path_and_currently_drawn(i)
                ? new Path2D(
                    getFreeDrawSvgPath(
                        arrays_of_points[i],
                        !is_last_path_and_currently_drawn(i)))
                : perfect_cache[i]
            perfect_cache[i] = path
            ctx.fill(path);
        }
        if (all_drawing_finished(i)) {
            nextLine++;
            nextPoint = 0;
        }
        startPoint = 0;
    }
    //Draw Calligraphy Strokes one by one starting from the given point
    for (var i = startStroke; i < strokes.length; i++) {
        nextStroke = i + 1;
        strokes[i].draw(WEIGHT, ctx);
    }

    if (fullRedraw) {//finished full redraw, now can unset redraw all flag so no more full redraws until necessary
        pleaseRedrawEverything = false;
        fullRedraw = false;
        nextPoint = strokes.length == 0 ? 0 : nextPoint;//reset next point if out of lines
        nextStroke = strokes.length == 0 ? 0 : nextStroke;//reset for undo as well
        if (fullClear) {// start again from 0.
            nextLine = 0;
            nextPoint = 0;
            nextStroke = 0;
            fullClear = false;
        }

        // 如果画布上没有任何笔迹，确保重置所有绘图状态
        if (arrays_of_points.length === 0 && strokes.length === 0) {
            nextLine = 0;
            nextPoint = 0;
            nextStroke = 0;
        }
    }
}

var drawingWithPressurePenOnly = false; // hack for drawing with 2 main pointers when using a presure sensitive pen

// 添加临时变量跟踪最近的笔事件
var lastPenDownTime = 0;
var pendingPenStroke = null;
var pendingPenStrokeTimer = null;

function pointerDownLine(e) {
    // 如果是触摸事件，不处理绘图事件，让它自然滚动页面
    if (e.pointerType === 'touch') {
        return;
    }

    // 如果使用Surface Pen笔端擦除模式，不进行绘制
    if (!visible || calligraphy || eraserMode || isPenEraserActive) return;

    // 对Surface Pen做特殊处理，延迟绘制以避免擦除模式误触发的点
    if (e.pointerType === 'pen') {
        // 只对笔类型的事件阻止默认行为，允许触摸滚动
        e.preventDefault();

        // 存储当前笔触信息和时间戳
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        lastPenDownTime = Date.now();

        // 清除之前可能存在的待定笔触计时器
        if (pendingPenStrokeTimer) {
            clearTimeout(pendingPenStrokeTimer);
        }

        // 暂存笔触信息
        pendingPenStroke = {
            x: x,
            y: y,
            lineMode: lineMode,
            rectangleMode: rectangleMode,
            e: e,
            button: e.button // 保存按钮信息
        };

        // 延迟处理，给系统时间检测笔端擦除按钮
        pendingPenStrokeTimer = setTimeout(function () {
            // 检查在延迟期间是否激活了笔端擦除或侧方按键橡皮擦
            if (isPenEraserActive || eraserMode) {
                pendingPenStroke = null;
                return;
            }

            // 如果是侧方按键（Surface Pen按钮1或2）点击，不绘制
            if (pendingPenStroke.button === 1 || pendingPenStroke.button === 2) {
                pendingPenStroke = null;
                return;
            }

            // 执行常规的笔触处理
            isPointerDown = true;

            if (pendingPenStroke.lineMode) {
                startPoint = { x: pendingPenStroke.x, y: pendingPenStroke.y };
            } else if (pendingPenStroke.rectangleMode) {
                rectangleStartPoint = { x: pendingPenStroke.x, y: pendingPenStroke.y };
            } else {
                mouseX = pendingPenStroke.x;
                mouseY = pendingPenStroke.y;
                arrays_of_points.push([[mouseX, mouseY, color, line_width]]);
                line_type_history.push('L');
                perfect_cache.push(null);

                // 如果这是完全清空画布后的第一笔，需要立即更新绘制状态
                if (arrays_of_points.length === 1) {
                    ts_redraw();
                }
            }

            pendingPenStroke = null;
        }, 20); // 延迟20毫秒，这个值可能需要根据实际情况调整

        return;
    }

    // 非笔触设备的原始处理逻辑（如鼠标）
    if (e.pointerType === 'mouse') {
        e.preventDefault(); // 只对鼠标事件阻止默认行为
    }

    isPointerDown = true;
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    if (lineMode) {
        startPoint = { x: x, y: y };
        return;
    }

    if (rectangleMode) {
        rectangleStartPoint = { x: x, y: y };
        return;
    }

    mouseX = x;
    mouseY = y;
    arrays_of_points.push([[mouseX, mouseY, color, line_width]]);
    line_type_history.push('L');
    perfect_cache.push(null);

    // 如果这是完全清空画布后的第一笔，需要立即更新绘制状态
    if (arrays_of_points.length === 1) {
        ts_redraw();
    }
}

function pointerMoveLine(e) {
    // 如果是触摸事件，直接返回，不处理绘图
    if (e.pointerType === 'touch') {
        return;
    }

    if (!visible || !isPointerDown || calligraphy || eraserMode || isPenEraserActive) return;

    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    if (lineMode) {
        if (startPoint) {
            // 清除上一次的临时线条
            secondary_ctx.clearRect(0, 0, secondary_canvas.width, secondary_canvas.height);

            // 使用直线专用设置
            update_line_settings();

            // 根据当前样式绘制临时线条
            if (lineStyle === 'wavy') {
                // 绘制波浪线预览，使用当前设置的颜色和线宽
                drawWavyLine(secondary_ctx, startPoint.x, startPoint.y, x, y, 2, 2, lineColor, lineWidth);
            } else {
                // 绘制直线/虚线预览
                secondary_ctx.beginPath();
                secondary_ctx.moveTo(startPoint.x, startPoint.y);
                secondary_ctx.lineTo(x, y);
                secondary_ctx.stroke();
            }
        }
        return;
    }

    if (rectangleMode) {
        if (rectangleStartPoint) {
            // 清除上一次的临时矩形
            secondary_ctx.clearRect(0, 0, secondary_canvas.width, secondary_canvas.height);

            // 使用矩形专用设置
            update_rectangle_settings();

            // 绘制矩形预览
            secondary_ctx.beginPath();
            secondary_ctx.rect(
                rectangleStartPoint.x,
                rectangleStartPoint.y,
                x - rectangleStartPoint.x,
                y - rectangleStartPoint.y
            );
            secondary_ctx.stroke();
        }
        return;
    }

    mouseX = x;
    mouseY = y;
    arrays_of_points[arrays_of_points.length - 1].push([mouseX, mouseY, color, line_width]);
}

/**
 * 绘制波浪线
 * @param {CanvasRenderingContext2D} ctx - 绘图上下文
 * @param {number} x1 - 起点X坐标
 * @param {number} y1 - 起点Y坐标
 * @param {number} x2 - 终点X坐标
 * @param {number} y2 - 终点Y坐标
 * @param {number} amplitude - 波浪振幅
 * @param {number} frequency - 波浪频率
 * @param {string} [strokeColor] - 线条颜色，如果未提供则使用全局lineColor
 * @param {number} [strokeWidth] - 线条宽度，如果未提供则使用全局lineWidth
 */
function drawWavyLine(ctx, x1, y1, x2, y2, amplitude, frequency, strokeColor, strokeWidth) {
    // 计算线段长度
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    // 计算方向向量
    const dirX = dx / length;
    const dirY = dy / length;

    // 计算垂直于方向的向量
    const perpX = -dirY;
    const perpY = dirX;

    // 波浪的固定波长(像素)
    const wavelength = 10;

    // 保存当前绘图状态
    ctx.save();

    // 设置线条样式，优先使用传入的颜色和宽度
    ctx.lineWidth = strokeWidth || lineWidth;
    ctx.strokeStyle = strokeColor || lineColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 使用路径绘制，而不是直接连接点
    ctx.beginPath();
    ctx.moveTo(x1, y1);

    // 通过更多的点来绘制更平滑的曲线
    // 使用更小的步长来确保曲线平滑
    const stepSize = 0.5;
    const totalSteps = Math.ceil(length / stepSize);

    for (let i = 0; i <= totalSteps; i++) {
        const t = i / totalSteps; // 归一化参数 [0, 1]

        // 计算当前点在直线上的位置
        const x = x1 + dirX * length * t;
        const y = y1 + dirY * length * t;

        // 使用固定波长计算波浪
        // 当前点的位置除以波长，然后乘以2π得到角度
        const angle = (length * t / wavelength) * Math.PI * 2;

        // 使用正弦函数创建波浪
        const wave = Math.sin(angle);

        // 使用固定振幅 - 减小为原来的一半
        const fixedAmplitude = amplitude / 2;

        // 应用偏移量垂直于直线方向
        const offsetX = perpX * fixedAmplitude * wave;
        const offsetY = perpY * fixedAmplitude * wave;

        // 绘制到当前点
        if (i === 0) {
            ctx.moveTo(x + offsetX, y + offsetY);
        } else {
            ctx.lineTo(x + offsetX, y + offsetY);
        }
    }

    // 使用曲线属性绘制路径
    ctx.stroke();
    ctx.restore();
}

// 修改pointerUpLine函数
function pointerUpLine(e) {
    // 如果是触摸事件，直接返回，不处理绘图
    if (e.pointerType === 'touch') {
        return;
    }

    // 当矩形正在绘制时，不处理普通的指针抬起事件
    if (isDrawingRect) return;

    if (!isPointerDown || calligraphy || eraserMode || isPenEraserActive) return;

    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    if (lineMode && startPoint) {
        var endX = x;
        var endY = y;

        // 保存当前样式信息
        var currentStyle = {
            style: lineStyle,
            dashPattern: lineDashPattern.slice()
        };

        // 保存线条数据 - 直线只需要两个点
        // 为每个点添加颜色和线宽信息，同时添加样式信息
        arrays_of_points.push([
            [startPoint.x, startPoint.y, lineColor, lineWidth, currentStyle], // 添加样式信息
            [endX, endY, lineColor, lineWidth, currentStyle]
        ]);
        line_type_history.push('L');
        perfect_cache.push(null);

        // 设置操作类型为添加
        strokeOperation = 'A';

        // 清除临时画布
        secondary_ctx.clearRect(0, 0, secondary_canvas.width, secondary_canvas.height);

        // 使用ts_redraw重绘整个画布，而不是直接在画布上绘制
        ts_redraw();

        startPoint = null;

        // 标记笔迹已变化，触发保存
        strokesChanged = true;
        save_strokes_debounced();
        return;
    } else if (rectangleMode && rectangleStartPoint) {
        var endX = x;
        var endY = y;

        // 创建矩形样式信息对象
        var currentStyle = {
            style: 'rectangle' // 标记为矩形
        };

        // 保存矩形数据 - 存储矩形左上角和右下角的点
        arrays_of_points.push([
            [rectangleStartPoint.x, rectangleStartPoint.y, rectangleColor, rectangleWidth, currentStyle], // 起点(左上)
            [endX, endY, rectangleColor, rectangleWidth, currentStyle] // 终点(右下)
        ]);
        line_type_history.push("R"); // 使用R表示矩形类型
        perfect_cache.push(null);

        // 设置操作类型为添加
        strokeOperation = 'A';

        // 清除临时画布
        secondary_ctx.clearRect(0, 0, secondary_canvas.width, secondary_canvas.height);

        // 使用ts_redraw重绘整个画布
        ts_redraw();

        rectangleStartPoint = null;

        // 标记笔迹已变化，触发保存
        strokesChanged = true;
        save_strokes_debounced();
        return;
    } else {
        // 确保松开鼠标/触控笔时重绘，避免第一笔不显示的问题
        ts_redraw();

        // 设置操作类型为添加
        strokeOperation = 'A';
    }

    isPointerDown = false;

    // 标记笔迹已变化，触发保存
    strokesChanged = true;
    save_strokes_debounced();
}

document.addEventListener('keyup', function (e) {
    // alt + Z or z
    if ((e.keyCode == 90 || e.keyCode == 122) && e.altKey) {
        e.preventDefault();
        ts_undo();
    }
    // 切换至画笔模式
    if (e.key === "w") {
        switch_drawing_mode();
    }
    // 切换至橡皮擦模式
    if (e.key === "q") {
        toggleEraser();
    }
    // 清除画布
    if (e.key === "c") {
        clear_canvas();
    }
    // ,
    if (e.key === "h") {
        switch_visibility();
    }

    // 书法家功能(alt + C)已禁用

    // 完美手写功能(alt + X)已禁用

    // 切换至全屏模式或小画布模式
    if (e.key === "f") {
        e.preventDefault();
        switch_small_canvas();
    }
    // alt + L or l
    if ((e.key === "l" || e.key === "L") && e.altKey) {
        e.preventDefault();
        switch_line_mode();
    }
    // alt + R or r
    if ((e.key === "r" || e.key === "R") && e.altKey) {
        e.preventDefault();
        switch_rectangle_mode();
    }
})
// ----------------------------------------- Perfect Freehand -----------------------------------------

function med(A, B) {
    return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
}

// Trim SVG path data so number are each two decimal points. This
// improves SVG exports, and prevents rendering errors on points
// with long decimals.
const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;

function getSvgPathFromStroke(points) {
    if (!points.length) {
        return "";
    }

    const max = points.length - 1;

    return points
        .reduce(
            (acc, point, i, arr) => {
                if (i === max) {
                    acc.push(point, med(point, arr[0]), "L", arr[0], "Z");
                } else {
                    acc.push(point, med(point, arr[i + 1]));
                }
                return acc;
            },
            ["M", points[0], "Q"],
        )
        .join(" ")
        .replace(TO_FIXED_PRECISION, "$1");
}

function getFreeDrawSvgPath(inputPoints, complete) {
    // Consider changing the options for simulated pressure vs real pressure
    const options = {
        simulatePressure: inputPoints[0][2] > 1,
        size: line_width,
        thinning: 0.6,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t) => Math.sin((t * Math.PI) / 2), // https://easings.net/#easeOutSine
        last: complete, // LastCommittedPoint is added on pointerup
    };

    return getSvgPathFromStroke(getStroke(inputPoints, options));
}
/*
 -------------------------------- Caligrapher ------------------------------------------
 Created By: August Toman-Yih
 Git Repository: https://github.com/atomanyih/Calligrapher
*/
/* ------------------------------        script.js        -----------------------------*/
//Modified to work with current canvas and board
//share the same canvas with pressure drawing
/*var canvas = document.getElementById('canvas'),
   width = canvas.width,
   height = canvas.height,
   context = canvas.getContext("2d");
   */

//FIXME REORGANIZE EBERYTING
//--- constants ---//
RESOLUTION = 4;
WEIGHT = 15;
MIN_MOUSE_DIST = 5;
SPLIT_THRESHOLD = 8;
SQUARE_SIZE = 300;

//--- variables ---//
strokes = [];
points = [];
lines = [];
currentPath = [];
errPoint = [];
//use shared isPointerDown instead
//mouseDown = false;

// // share update function with pressure drawing so they don't clearRect eachother
// function update() {
//     ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
//     for(var i = 0; i<strokes.length; i++)
//         strokes[i].draw(WEIGHT,ctx);
// }

function drawCurrentPath() {
    secondary_ctx.beginPath();
    secondary_ctx.moveTo(currentPath[0][0], currentPath[0][1]);
    for (var i = 1; i < currentPath.length; i++) {
        secondary_ctx.lineTo(currentPath[i][0], currentPath[i][1]);
    }
    secondary_ctx.stroke();
}

// 添加书法笔触延迟处理变量
var pendingCalligraphyStroke = null;
var pendingCalligraphyTimer = null;

function pointerDownCaligraphy(e) {
    // 如果是触摸事件，不处理绘图事件，让它自然滚动页面
    if (e.pointerType === 'touch') {
        return;
    }

    wrapper.classList.add('nopointer');
    if (!e.isPrimary || !calligraphy || isPenEraserActive) { return; }

    // 对Surface Pen做特殊处理，延迟绘制以避免擦除模式误触发
    if (e.pointerType === 'pen') {
        // 只对笔类型的事件阻止默认行为，允许触摸滚动
        e.preventDefault();

        // 清除之前可能存在的待定笔触计时器
        if (pendingCalligraphyTimer) {
            clearTimeout(pendingCalligraphyTimer);
        }

        // 存储当前事件
        pendingCalligraphyStroke = {
            e: e,
            button: e.button // 保存按钮信息
        };

        // 延迟处理，给系统时间检测笔端擦除按钮
        pendingCalligraphyTimer = setTimeout(function () {
            // 如果当前处于笔端擦除模式，或侧方按键橡皮擦模式，则不处理
            if (isPenEraserActive || eraserMode) {
                pendingCalligraphyStroke = null;
                return;
            }

            // 如果是侧方按键（Surface Pen按钮1或2）点击，不绘制
            if (pendingCalligraphyStroke.button === 1 || pendingCalligraphyStroke.button === 2) {
                pendingCalligraphyStroke = null;
                return;
            }

            // 添加新书法线标记到共享历史
            line_type_history.push('C');
            start_drawing();

            pendingCalligraphyStroke = null;
        }, 20); // 延迟20毫秒，这个值可能需要根据实际情况调整

        return;
    }

    // 非Surface Pen设备的原始处理逻辑
    if (e.pointerType === 'mouse') {
        event.preventDefault(); // 只对鼠标事件阻止默认行为
    }

    line_type_history.push('C'); // 将新书法线标记添加到共享历史
    start_drawing();
}

function pointerMoveCaligraphy(e) {
    // 如果是触摸事件，直接返回，不处理绘图
    if (e.pointerType === 'touch') {
        return;
    }

    if (!e.isPrimary || !calligraphy || isPenEraserActive) { return; }
    if (isPointerDown) {
        var mousePos = [e.offsetX, e.offsetY];
        if (currentPath.length != 0) {
            if (getDist(mousePos, currentPath[currentPath.length - 1]) >= MIN_MOUSE_DIST)
                currentPath.push(mousePos);
            drawCurrentPath();
        } else
            currentPath.push(mousePos);
    }
};

function pointerUpCaligraphy(e) {
    // 如果是触摸事件，直接返回，不处理绘图
    if (e.pointerType === 'touch') {
        return;
    }

    wrapper.classList.remove('nopointer');
    stop_drawing();
    if (!e.isPrimary || !calligraphy || !currentPath.length || isPenEraserActive) { return; }
    points = currentPath;

    var curves = fitStroke(points);

    strokes.push(new Stroke(curves));

    currentPath = [];// clear the array on pointer up so it doesnt enter new lines when clicking on buttons
    secondary_ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);//clear the guide line in second canvas

    // 标记笔迹已变化，触发保存
    strokesChanged = true;
    save_strokes_debounced();
}

// // handled in ts_undo()
// keydown = function(event) {
//     var k = event.keyCode;
//     console.log(k);
//     if(k==68) {
//         strokes.pop();
//     }
//     update();
// };
//
//window.addEventListener("keydown",keydown,true);
//
//update();

/* ------------------------------Unchanged Caligrapher Code------------------------------*/
/* ------------------------------        Corners.js        ------------------------------*/
/**
 * @classDescription        A shape made out of bezier curves. Hopefully connected
 * @param {Array} sections
 */
function BezierShape(sections) {
    this.sections = sections;
    this.name = ""; //optional
    this.skeleton = [];
}

BezierShape.prototype.copy = function () {
    var newSections = [],
        newSkeleton = [];
    for (var i in this.sections) {
        newSections[i] = [];
        for (var j = 0; j < 4; j++) {
            newSections[i][j] = this.sections[i][j].slice(0);
        }
    }
    for (var i in this.skeleton)
        newSkeleton[i] = this.skeleton[i].copy();

    var copy = new BezierShape(newSections);
    copy.name = this.name;
    copy.skeleton = newSkeleton;
    return copy;
};

/**
 * Draws the BezierShape NO SCALING OR NUFFIN. Probably only used internally
 * @param {Object} ctx
 */
BezierShape.prototype.draw = function (ctx) {
    var x = this.sections[0][0][0], //ew
        y = this.sections[0][0][1];
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (var i = 0; i < this.sections.length; i++) {
        var b = this.sections[i];
        ctx.bezierCurveTo(b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]);
    }
    ctx.closePath();

    ctx.fill();
};

function Bone(points, offset) {
    this.points = points;
    this.offset = offset;
}

Bone.prototype.copy = function () {
    var nP = [];
    for (var i in this.points)
        nP[i] = this.points[i].slice(0);
    return new Bone(nP, this.offset);
};

function drawCornerScaled(corner, pos, dir, width, height, ctx) { //FIXME degree, radian inconsistency
    ctx.save();
    ctx.translate(pos[0], pos[1]);
    ctx.rotate(dir);
    ctx.scale(height, width);

    corner.draw(ctx);
    ctx.restore();
}

function drawCorner(corner, pos, dir, width, ctx) {
    drawCornerScaled(corner, pos, dir, width, width, ctx);
}

function drawDICorner(corner, pos, dir, width, ctx) {
    if (corner == null)
        return;

    // corner rotation
    var pos = attrs.point,
        inAngle = attrs.inAngle - corner.skeleton["armA"].offset, //This is so the whole corner is rotated //FIXME a little gross
        outAngle = attrs.outAngle,
        c = setBoneAngles(corner, [["armB", (outAngle - inAngle) / 180 * Math.PI]]);

    drawCorner(c, pos, inAngle / 180 * Math.PI, width, ctx);
}



// HERE ARE SOME CORNERS // some may need to be rotated
kappa = 0.5522847498;
// Circle-ish thing. Not a corner.
CIRCLE = new BezierShape([
    [[-5, 0], [-5, -5 * kappa], [-5 * kappa, -5], [0, -5]],
    [[0, -5], [5 * kappa, -5], [5, -5 * kappa], [5, 0]],
    [[5, 0], [5, 5 * kappa], [5 * kappa, 5], [0, 5]],
    [[0, 5], [-5 * kappa, 5], [-5, 5 * kappa], [-5, 0]]
]);


C1 = new BezierShape([
    [[15, 6], [-3, 4], [-11, 5], [-20, 0]]
    , [[-20, 0], [-15, -5], [4, -9], [13, -5]]
    , [[13, -5], [20, 0], [21, 8], [15, 6]]
]);
C1.name = "C1";

C2 = new BezierShape([
    [[2, 5], [-2, 5], [-12, 2], [-13, -2]]
    , [[-13, 2], [-7, -5], [0, -5], [2, -5]]
    , [[2, -5], [3, -5], [3, 5], [2, 5]]
]);
C2.name = "C2";

C3 = new BezierShape([
    [[-8, 5], [-10, 5], [-10, -5], [-8, -5]]
    , [[-8, -5], [3, -5], [15, 0], [15, 5]]
    , [[15, 5], [10, 7], [2, 5], [-8, 5]]
]);
C3.name = "C3";

C4 = new BezierShape([
    [[0, 5], [-2, 5], [-4, 7], [-5, 8]]
    , [[-5, 8], [-7, 10], [-9, 12], [-8, 5]]
    , [[-8, 5], [-7, 3], [-5, -5], [0, -5]]
    , [[0, -5], [3, -5], [3, 5], [0, 5]]
]);
C4.name = "C4";

C5 = new BezierShape([
    [[0, -5], [-3, -5], [-3, 5], [0, 5]]
    , [[0, 5], [8, 5], [10, 5], [15, 2]]
    , [[15, 2], [12, -2], [-2, -5], [0, -5]]
]);
C5.name = "C5";

C6 = new BezierShape([
    [[0, 5], [-6, 6], [-8, 7], [-12, 8]]
    , [[-12, 8], [-13, 9], [-13, 7], [-12, 6]]
    , [[-12, 6], [-10, 3], [-5, -4], [0, -5]]
    , [[0, -5], [3, -5], [3, 5], [0, 5]]
]);
C6.name = "C6";

C7 = new BezierShape([
    [[-5, -5], [0, -5], [11, -7], [15, -6]]
    , [[15, -6], [17, -5], [2, 4], [1, 5]]
    , [[1, 5], [0, 5], [0, 5], [-5, 5]]
    , [[-5, 5], [-8, 5], [-8, -5], [-5, -5]]
]);
C7.name = "C7";

SI_CORNERS = [C1, C2, C3, C4, C5, C6, C7];

C8 = new BezierShape([
    [[-13, 3], [-20, 3], [-20, -3], [-13, -3]],
    [[-13, -3], [-5, -5], [-6, -7], [-4, -8]],
    [[-4, -8], [0, -8], [12, 3], [7, 5]],
    [[7, 5], [5, 6], [5, 8], [3, 13]],
    [[3, 13], [3, 20], [-3, 20], [-3, 13]],
    [[-3, 13], [-5, 5], [-10, 5], [-13, 3]]
]);
C8.name = "C8";
C8.skeleton["armA"] = new Bone([[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [5, 2], [5, 3]], 0);
C8.skeleton["armB"] = new Bone([[4, 0], [4, 1], [4, 2], [4, 3], [3, 2], [3, 3], [5, 0], [5, 1],
[1, 2], [1, 3], [2, 0], [2, 1]], 90);

C8R = horizFlipCopy(C8);

/*C9 = new BezierShape([ //TODO fix corner so that stem moves depending on angle
    [[-3,-10],  [-3,-15],   [3,-15],    [3,-10]],
    [[3,-10],   [5,-5],     [6,6],      [0,11]],
    [[0,11],    [-5,15],    [-3,5],     [-10,3]],
    [[-10,3],   [-15,3],    [-15,-3],   [-10,-3]],
    [[-10,-3],  [-5,-5],    [-5,-7],    [-3,-10]]
]);
C9.name = "C9";
C9.skeleton["armA"] = new Bone([[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[4,2],[4,3]],90);
C9.skeleton["armB"] = new Bone([[3,0],[3,1],[3,2],[3,3],[4,0],[4,1],[2,2],[2,3]],180);*/

C9 = new BezierShape([ //note, 90º angles look a little weird
    [[-4, -12], [-4, -15], [4, -15], [5, -12]],
    [[5, -12], [5, -2], [6, 3], [1, 8]],
    [[-1, 8], [-3, 11], [-4, 2], [-12, -5]],
    [[-12, -5], [-15, -7], [-15, -9], [-10, -8]],
    [[-10, -8], [-6, -8], [-4, -7], [-4, -12]]
]);
C9.name = "C9";
C9.skeleton["armA"] = new Bone([[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [4, 2], [4, 3], [1, 2]], 90); //not that this actually matters
C9.skeleton["armB"] = new Bone([[3, 0], [3, 1], [3, 2], [3, 3], [4, 0], [4, 1], [2, 2], [2, 3]], 210);

C9R = vertFlipCopy(C9);

C10 = new BezierShape([
    [[-5, 5], [-6, 5], [-6, -5], [-5, -5]],
    [[-5, -5], [-2, -7], [2, -7], [5, -5]],
    [[5, -5], [6, -5], [6, 5], [5, 5]],
    [[5, 5], [2, 7], [-2, 7], [-5, 5]]
]);

C10.name = "C10";
C10.skeleton["armA"] = new Bone([[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 2], [3, 2], [3, 3]], 0);
C10.skeleton["armB"] = new Bone([[2, 0], [2, 1], [2, 2], [2, 3], [3, 0], [3, 1], [1, 2], [1, 3]], 0);

function linInterpolate(y0, y1, mu) {
    return y0 * (1 - mu) + y1 * mu;
}

function cosInterpolate(y0, y1, mu) {
    var mu2 = (1 - Math.cos(mu * Math.PI)) / 2;
    return y0 * (1 - mu2) + y1 * mu2;
}

/**
 * Returns a function that linearly interpolates between the values given
 */
function linFunction(points) {
    return function (t) {
        if (t == 0)
            return points[0][1];
        for (var i = 1; i < points.length; i++) {
            var p0 = points[i - 1],
                p1 = points[i];
            if (t <= p1[0] && t > p0[0]) {
                var mu = (t - p0[0]) / (p1[0] - p0[0]);
                return linInterpolate(p0[1], p1[1], mu); //cubic might be better
            }
        }
    };
}

/**
 * Returns a function that cosine interpolates between the values given
 */
function cosFunction(points) {
    return function (t) {
        if (t == 0)
            return points[0][1];
        for (var i = 1; i < points.length; i++) {
            var p0 = points[i - 1],
                p1 = points[i];
            if (t <= p1[0] && t > p0[0]) {
                var mu = (t - p0[0]) / (p1[0] - p0[0]);
                return cosInterpolate(p0[1], p1[1], mu); //cubic might be better
            }
        }
    };
}

//example thickness functions
function one(t) {
    return 1;
}

function test(t) {
    return t;
}

//These are ugly
SEGMENT_I = cosFunction([[0, 1], [.5, .7], [1, 1]]); //FIXME, sometimes extends past corners
SEGMENT_II = linFunction([[0, 1], [.5, .8], [1, .2]]); //kinda ugly :||
SEGMENT_III = linFunction([[0, .2], [.5, .8], [1, 1]]);

HEN = [C2, SEGMENT_I, C3];
SHU1 = [C4, SEGMENT_I, C5];
SHU2 = [C4, SEGMENT_II];
NA = [C6, SEGMENT_I, C7];
DIAN = [C1];
OTHER = [C4, SEGMENT_II];

function RAND(t) {
    return Math.random();
}

function setBoneAngles(c, dirList) {
    var c = c.copy();

    for (var i in dirList) {
        var dir = dirList[i][1],
            bone = dirList[i][0];
        for (var j in c.skeleton[bone].points) {
            var p = c.skeleton[bone].points[j],
                offset = c.skeleton[bone].offset / 180 * Math.PI,
                vec = c.sections[p[0]][p[1]];
            //console.log(vec);
            //console.log(dir-offset);
            //console.log(rotate(vec,dir-offset));
            c.sections[p[0]][p[1]] = rotate(vec, dir - offset);

        }
    }

    return c;
}

function vertFlipCopy(c) {
    var c = c.copy();

    for (var i in c.sections) {
        for (var j in c.sections[i]) {
            c.sections[i][j][1] = -c.sections[i][j][1];
        }
    }
    for (var i in c.skeleton) {
        c.skeleton[i].offset = 360 - c.skeleton[i].offset;
    }
    return c
}

function horizFlipCopy(c) {
    var c = c.copy();

    for (var i in c.sections) {
        for (var j in c.sections[i]) {
            c.sections[i][j][0] = -c.sections[i][j][0];
        }
    }
    for (var i in c.skeleton) {
        c.skeleton[i].offset = 180 - c.skeleton[i].offset;
        if (c.skeleton[i].offset < 0)
            c.skeleton[i].offset += 360;
    }
    return c
}

/* ------------------------------        bezier.js        ------------------------------*/

//TODO use vectors for everything so it's less stupid

// Generalized recurvsive BEZIER FUNCTIONS (why am I doing it this way I don't know)
/**
 * returns a point on the bezier curve
 * @param {Array} ps    Control points of bezier curve
 * @param {Numeric} t   Location along bezier curve [0,1]  
 * @return {Array}      Returns the point on the bezier curve
 */
function bezierPos(ps, t) {
    var size = ps.length;
    if (size == 1)
        return ps[0];

    //WARNING, changed direction on this. May cause problems
    var bx = (t) * bezierPos(ps.slice(1), t)[0] + (1 - t) * bezierPos(ps.slice(0, size - 1), t)[0],
        by = (t) * bezierPos(ps.slice(1), t)[1] + (1 - t) * bezierPos(ps.slice(0, size - 1), t)[1];

    return [bx, by];
}

function bezierSlo(ps, t) {
    var size = ps.length;

    if (size == 1)
        return ps[0];

    var dx = bezierPos(ps.slice(0, size - 1), t)[0] - bezierPos(ps.slice(1), t)[0],
        dy = bezierPos(ps.slice(0, size - 1), t)[1] - bezierPos(ps.slice(1), t)[1];

    return dy / dx;
}

// Bezier function class. Meant simply as a math thing (no drawing or any bullshit)
/**
 * @class Bezier function class.
 * @return {Bezier} Returns the bezier function
 */
function Bezier(controlPoints) {
    this.order = controlPoints.length - 1; //useful? or obtuse? //Answer: not used anywhere
    this.controlPoints = controlPoints;
}

Bezier.prototype.getStart = function () {
    return this.controlPoints[0];
};

Bezier.prototype.getEnd = function () {
    return this.controlPoints[this.order];
};

Bezier.prototype.getPoint = function (t) {
    return bezierPos(this.controlPoints, t);
};

Bezier.prototype.drawPlain = function (ctx) {
    if (this.order == 3) {
        var c = this.controlPoints;
        ctx.beginPath();
        ctx.moveTo(c[0][0], c[0][1]);
        ctx.bezierCurveTo(c[1][0], c[1][1], c[2][0], c[2][1], c[3][0], c[3][1]);
        ctx.stroke();
    }

};

Bezier.prototype.getDerivativeVector = function (t) {
    var size = 0.001,
        p0 = null,
        p1 = null;
    if (t < size) {
        p0 = bezierPos(this.controlPoints, t);
        p1 = bezierPos(this.controlPoints, t + 2 * size);
    } else if (1 - t < size) {
        p0 = bezierPos(this.controlPoints, t - 2 * size);
        p1 = bezierPos(this.controlPoints, t);
    } else {
        p0 = bezierPos(this.controlPoints, t - size);
        p1 = bezierPos(this.controlPoints, t + size);
    }
    return sub(p1, p0);
};

Bezier.prototype.getTangentVector = function (t) {
    return normalize(this.getDerivativeVector(t));
};

Bezier.prototype.getLength = function () {
    var res = 50, //FIXME: can't use resolution :|| that would be circular
        len = 0,
        point = this.getStart();
    for (var i = 0; i <= res; i++) {
        var t = i / res;
        len += getDist(point, this.getPoint(t));
        point = this.getPoint(t);
    }
    return len;
};

Bezier.prototype.getLengthAt = function (t) {
    return getLengthAtWithStep(t, 0.01);
};

Bezier.prototype.getLengthAtWithStep = function (t, s) {
    var tt = 0,
        len = 0,
        point = this.getStart();
    while (tt <= t) {
        var newPoint = this.getPoint(tt);
        len += getDist(point, newPoint);
        point = newPoint;
        t += s;
    }
    return len;
};

Bezier.prototype.getPointByLength = function (l) {//doesn't actually return a point. bad name
    var t = 0,
        len = 0,
        point = this.getStart();
    while (len < l) {
        var newPoint = this.getPoint(t);
        len += getDist(point, newPoint);
        point = newPoint;
        t += 0.01;
        if (t >= 1)
            return 1; //so we don't extrapolate or anything stupid
    }
    return t;
};

Bezier.prototype.getPointByLengthBack = function (l) {//doesn't actually return a point. bad name
    var t = 1,
        len = 0,
        point = this.getEnd();
    while (len < l) {
        var newPoint = this.getPoint(t)
        len += getDist(point, newPoint);
        point = newPoint;
        t -= 0.01;
        if (t <= 0)
            return 1; //so we don't extrapolate or anything stupid
    }
    return t;
};

function getSlopeVector(slope, length) {
    var x = length * Math.cos(Math.atan(slope)),
        y = length * Math.sin(Math.atan(slope));
    return [x, y];
}

function scalePoint(s0, s1, p0, p1, v) { //Could probs be simplified, also currently not used
    var xScale = (p1[0] - p0[0]) / (s1[0] - s0[0]), //scaling factos
        yScale = (p1[1] - p0[1]) / (s1[1] - s0[1]),
        x = p0[0] + xScale * (v[0] - s0[0]), //Scaled x and y
        y = p0[1] + yScale * (v[1] - s0[1]);
    return [x, y];
}

//Draws a bezier curve scaled between the two points (good idea? bad idea? dunno.) 
/**
 * @param {Bezier}  curve   The bezier curve to be drawn
 * @param {Numerical} wid   Nominal width
 * @param {Function} wF     Width function
 * @param {Context} ctx     Context to draw to
 */
//FIXME width function gets "bunched up" around control points (detail below)
//      the bezier calculation means that more of t is spent near control points. turn on debug to see
//      this is good for detail b/c it means higher resolution at tight curves (a happy accident)
//      but the width contour gets a bit bunched up. solution: instead of wF(t), use wF(currentLength/totalLength)

//FIXME Ugly (code)
function drawBezier(curve, wid, wF, ctx) {
    var length = curve.getLength(),
        numPoints = Math.round(length / RESOLUTION),
        leftPoints = [],
        rightPoints = [],
        currentPoint = sub(scale(curve.getStart(), 2), curve.controlPoints[1]);

    for (var i = 0; i <= numPoints; i++) {
        var t = i / numPoints,
            centerPoint = curve.getPoint(t)
        offset = scale(perpNorm(sub(centerPoint, currentPoint)), wF(t) * wid / 2);

        leftPoints.push(add(centerPoint, offset));
        rightPoints.push(sub(centerPoint, offset));
        currentPoint = centerPoint;

    }
    //Drawing the polygon
    var s = leftPoints[0];
    ctx.beginPath();
    ctx.moveTo(s[0], s[1]); //starting from start center
    for (var i = 0; i < leftPoints.length; i++) {
        var p = leftPoints[i];
        ctx.lineTo(p[0], p[1]);
    }
    for (var i = rightPoints.length - 1; i >= 0; i--) {
        var p = rightPoints[i];
        ctx.lineTo(p[0], p[1]);
    }
    ctx.closePath();
    ctx.fill();
}

function drawBezierTransformed(p0, p1, curve, wid, wF, ctx) {
    var s0 = curve.getStart(),
        s1 = curve.getEnd(),
        xScale = (p1[0] - p0[0]) / (s1[0] - s0[0]), //scaling factos
        yScale = (p1[1] - p0[1]) / (s1[1] - s0[1]),
        controlPoints = [];

    for (var i = 0; i <= curve.order; i++) {
        var p = curve.controlPoints[i],
            x = p0[0] + xScale * (p[0] - s0[0]), //Scaled x and y
            y = p0[1] + yScale * (p[1] - s0[1]);
        controlPoints[i] = [x, y];
    }
    drawBezier(new Bezier(controlPoints), wid, wF, ctx);

}

/* ------------------------------        curveFitting.js        ------------------------------*/
function getLengths(chord) {
    var lens = [0]; //first is 0

    for (var i = 1; i < chord.length; i++)
        lens[i] = lens[i - 1] + getDist(chord[i], chord[i - 1]);
    return lens;
}

function normalizeList(lens) {
    for (var i = 1; i < lens.length; i++)
        lens[i] = lens[i] / lens[lens.length - 1];
    return lens;
}

function findListMax(list) {
    var iMax = 0,
        max = list[0];
    for (var i = 0; i < list.length; i++) {
        if (max < list[i]) {
            iMax = i;
            max = list[i];
        }
    }
    return [iMax, max];
}

function findListMin(list) {
    var iMin = 0,
        min = list[0];
    for (var i in list) {
        if (min > list[i]) {
            iMin = i;
            min = list[i];
        }
    }
    return [iMin, min];
}

function parameterize(chord) {
    /*var lens = getLengths(chord);
    return normalizeList(lens);*/
    var lens = [0]; //first is 0

    for (var i = 1; i < chord.length; i++)
        lens[i] = lens[i - 1] + getDist(chord[i], chord[i - 1]);
    for (var i = 1; i < chord.length; i++)
        lens[i] = lens[i] / (lens[chord.length - 1]);
    return lens;

}

function parameterizeByLength(chord, curve) {
    var lens = getLengths(chord),
        ts = [0];
    for (var i = 1; i < chord.length; i++) {
        ts[i] = curve.getPointByLength(lens[i]);
    }
    return normalizeList(ts);
}

function coefficientHelper(chord, ts) { //bad name
    var c00 = 0, c01 = 0, c02x = 0, c02y = 0,
        c10 = 0, c11 = 0, c12x = 0, c12y = 0,
        x0 = chord[0][0],
        y0 = chord[0][1],
        x3 = chord[chord.length - 1][0],
        y3 = chord[chord.length - 1][1];

    for (var i = 0; i < ts.length; i++) {
        var t = ts[i],
            px = chord[i][0],
            py = chord[i][1];
        c00 += 3 * Math.pow(t, 2) * Math.pow(1 - t, 4); //I'm doing it the dumb way cause it's easier to read
        c01 += 3 * Math.pow(t, 3) * Math.pow(1 - t, 3);
        c02x += t * Math.pow(1 - t, 2) * (px - Math.pow(1 - t, 3) * x0 - Math.pow(t, 3) * x3);
        c02y += t * Math.pow(1 - t, 2) * (py - Math.pow(1 - t, 3) * y0 - Math.pow(t, 3) * y3);

        c10 += 3 * Math.pow(t, 3) * Math.pow(1 - t, 3);
        c11 += 3 * Math.pow(t, 4) * Math.pow(1 - t, 2);
        c12x += Math.pow(t, 2) * (1 - t) * (px - Math.pow(1 - t, 3) * x0 - Math.pow(t, 3) * x3);
        c12y += Math.pow(t, 2) * (1 - t) * (py - Math.pow(1 - t, 3) * y0 - Math.pow(t, 3) * y3);
    }
    return [[[c00, c01, c02x], [c10, c11, c12x]],
    [[c00, c01, c02y], [c10, c11, c12y]]];
}

function leastSquaresFit(chord, ts) { //IT FUCKIN WORKS FUCK YEAAAAAH
    if (chord.length < 4) {
        var c1 = chord[0],
            c4 = chord[chord.length - 1],
            c2 = midpoint(c1, c4, 0.25),
            c3 = midpoint(c1, c4, 0.75);
        return new Bezier([c1, c2, c3, c4]);
    }
    var cs = coefficientHelper(chord, ts),
        xs = gaussianElimination(cs[0]),
        ys = gaussianElimination(cs[1]);

    return new Bezier([chord[0], [xs[0], ys[0]], [xs[1], ys[1]], chord[chord.length - 1]]);
}

function getMaxErrorPoint(chord, ts, curve) {
    var max = 0,
        iMax = 0;
    for (var i = 0; i < ts.length; i++) {
        var dist = getDist(curve.getPoint(ts[i]), chord[i]);
        if (dist > max) {
            max = dist;
            iMax = i;
        }
    }
    return [iMax, max];
}

function fitStroke(chord) {
    var chords = splitChord(chord, detectCorners(chord)),
        curves = [];

    for (var i in chords) {
        var ts = parameterize(chords[i]),
            curve = leastSquaresFit(chords[i], ts);
        curves.push(curve);
    }

    return curves;
}

function splitCurve(chord, ts, curve) { //TODO FIGURE THIS FUCKING SHIT OUT
    var errs = [];
    for (var i = 1; i < chord.length; i++) {
        var chord1 = chord.slice(0, i + 1),
            chord2 = chord.slice(i),
            ts1 = parameterize(chord1),
            ts2 = parameterize(chord2),
            curve1 = leastSquaresFit(chord1, ts1),
            curve2 = leastSquaresFit(chord2, ts2);
        errs.push(sumSquaredError(chord1, ts1, curve1) +
            sumSquaredError(chord2, ts2, curve2));
    }
    //console.log(errs);
    return findListMin(errs);
}

function splitCurveAt(chord, i) {
    var chord1 = chord.slice(0, i + 1),
        chord2 = chord.slice(i),
        ts1 = parameterize(chord1),
        ts2 = parameterize(chord2),
        curve1 = leastSquaresFit(chord1, ts1),
        curve2 = leastSquaresFit(chord2, ts2);
    return [curve1, curve2];
}

function sumSquaredError(chord, ts, curve) {
    var sum = 0;
    for (var i in chord) {
        sum += Math.pow(getDist(chord[i], curve.getPoint(ts[i])), 2);
    }
    return sum;
}

// corner detection?

function detectCorners(chord) {
    var segmentLength = 30,
        angleThreshold = 135,
        indices = [];
    for (var i = 1; i < chord.length - 1; i++) {
        var angle = getSmallerAngle(getAngleBetween(sub(chord[i - 1], chord[i]), sub(chord[i + 1], chord[i]))) * 180 / Math.PI;

        if (angle <= angleThreshold) {
            indices.push(i);
        }
    }

    return indices;
}

//returns the shortest segment of the chord that is at least the given length
function getChordSegmentByLength(chord, length) {
    var dist = 0;
    var i = 0;
    while (dist < length) {
        i++;
        if (i >= chord.length) //if it's not long enough just return the whole thing
            return chord;
        dist += getDist(chord[i], chord[i - 1]);
    }
    return chord.slice(0, i);
}

function splitChord(chord, indices) {
    var newChords = [],
        ind = 0;
    for (var i in indices) {
        newChords.push(chord.slice(ind, indices[i] + 1));
        ind = indices[i];
    }
    newChords.push(chord.slice(ind));
    return newChords;
}

function chordPrint(chord) {
    var s = "| ";
    for (var i in chord) {
        s += chord[i] + " | ";
    }
    //console.log(s);
}

/* ------------------------------        strokeDrawing.js        ------------------------------*/

//Stroke drawing and analysis
//Basically, a "stroke" will be a collection of segments
//the segments when drawn will be assigned corners and types and stuff

function drawSegment(wF, segment, width, ctx) {
    drawBezier(segment, width, wF, ctx);
    //ctx.fillStyle = "rgba(0,0,0,1)";
}



function drawBasicStroke(segment, width, ctx) { //TODO
    var attrs = getSegmentAttributes(segment),
        comps = checkRules2(attrs, RULE_BS);

    //corners
    if (comps.length == 1) { //dian
        var point = midpoint(attrs.startPoint, attrs.endPoint, 0.5);  //FIXME these stupid width division factors
        drawCornerScaled(comps[0], point, degToRad(attrs.startAngle), width / 13, attrs.length / 20, ctx);
    } else {
        drawCorner(comps[0], attrs.startPoint, degToRad(attrs.startAngle), width / 10, ctx);
        if (comps.length == 3) {
            drawCorner(comps[2], attrs.endPoint, degToRad(attrs.endAngle), width / 10, ctx);
        }

        drawSegment(comps[1], segment, width, ctx);
    }
}

function Stroke(segments) {
    this.segments = segments;
}

Stroke.prototype.drawPlain = function (ctx) {
    var x = this.segments[0].getStart()[0],
        y = this.segments[0].getStart()[1];
    ctx.moveTo(x, y);
    for (var i = 0; i < this.segments.length; i++) {
        var b = this.segments[i].controlPoints;
        ctx.bezierCurveTo(b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]);
    }
    ctx.stroke();
};

Stroke.prototype.draw = function (width, ctx) {
    if (this.segments.length == 1) { //Basic Stroke
        drawBasicStroke(this.segments[0], width, ctx);
    } else { //Compound stroke
        drawCompoundStroke(this, width, ctx);
    }
};

function drawCompoundStroke(stroke, width, ctx) { //FIXME copypasta
    var numSegments = stroke.segments.length;

    //corners
    var attrs = getSegmentAttributes(stroke.segments[0]),
        corners = [];

    var corner = checkRules2(attrs, RULE_CC_START);//checkRules(attrs,COMPOUND_CORNER_START);
    if (corner != null)
        drawCorner(corner, attrs.startPoint, attrs.startAngle / 180 * Math.PI, width / 10, ctx);
    corners.push(corner);

    for (var i = 1; i < numSegments; i++) {
        attrs = getCornerAttributes(stroke.segments[i - 1], stroke.segments[i]);
        corner = checkRules2(attrs, RULE_CC_MID);//checkRules(attrs,COMPOUND_CORNER_MID);
        if (corner != null)
            drawDICorner(corner, attrs, width / 10, ctx);
        corners.push(corner);
    }
    attrs = getSegmentAttributes(stroke.segments[numSegments - 1]);
    corner = checkRules2(attrs, RULE_CC_END);//checkRules(attrs,COMPOUND_CORNER_END);
    if (corner != null)
        drawCorner(corner, attrs.endPoint, attrs.endAngle / 180 * Math.PI, width / 10, ctx);
    corners.push(corner);

    //SEGMENTS FIXME gross code

    if (corners[0] == null)
        drawSegment(SEGMENT_III, stroke.segments[0], width, ctx);
    else
        drawSegment(SEGMENT_I, stroke.segments[0], width, ctx);
    for (var i = 1; i < numSegments - 1; i++) {
        drawSegment(SEGMENT_I, stroke.segments[i], width, ctx); //FIXME only segment I. this is not done!
    }
    if (corners[numSegments] == null)
        drawSegment(SEGMENT_II, stroke.segments[numSegments - 1], width, ctx);
    else
        drawSegment(SEGMENT_I, stroke.segments[numSegments - 1], width, ctx);
    //ctx.fillStyle = "rgba(0,0,0,1)";

}

function inRange(num, range) {
    return num >= range[0] && num < range[1];
}

function inRanges(num, ranges) {
    for (var i = 0; i < ranges.length; i++) {
        if (inRange(num, ranges[i]))
            return true;
    }
    return false;
}

function getSegmentAttributes(seg) {
    var attrs = {
        "startAngle": getSegAngleStart(seg) * 180 / Math.PI,
        "endAngle": getSegAngleEnd(seg) * 180 / Math.PI,
        "startPoint": seg.getStart(),
        "endPoint": seg.getEnd(),
        "length": seg.getLength()
    };
    return attrs;
}

function getCornerAttributes(inSeg, outSeg) {
    var attrs = {
        "inAngle": getSegAngleEnd(inSeg) * 180 / Math.PI,
        "outAngle": getSegAngleStart(outSeg) * 180 / Math.PI,
        "point": inSeg.getEnd()
    };
    attrs.betweenAngle = getInnerAngle(attrs.inAngle, attrs.outAngle);
    //console.log(attrs.inAngle,attrs.outAngle);
    //console.log(attrs.betweenAngle);
    return attrs;
}

function getInnerAngle(inAngle, outAngle) { //If outAngle is past inAngle, then it's negative
    inAngle = reduceAngleDeg(inAngle + 180);
    var ang = Math.abs(getSmallerAngleDeg(inAngle - outAngle));
    if (inAngle > outAngle) {
        if (inAngle - 180 < outAngle)
            return ang;
        return -ang;
    } else {
        if (outAngle - 180 < inAngle)
            return -ang;
        return ang;
    }

}

function innerAngleHelper(angle) { //if it's negative then it is the other angle
    if (angle > 180)
        return angle - 360;
    return angle;
}

function checkRule(obj, rule) {
    if (rule[0] == "Result")
        return rule[1];
    //console.log(rule[0]);
    if (inRange(obj[rule[0]], rule[1]))
        return checkRule(obj, rule[2]);
    return null;
}

function checkRules(obj, ruleset) { //checks all rules, no shortcircuiting currently
    var results = [];
    //console.log("Checking rules");
    for (var i = 0; i < ruleset.length - 1; i++) {
        var result = checkRule(obj, ruleset[i]);
        if (result != null)
            results.push(result);
    }
    if (results.length > 1)
        throw "Overlapping conditions";
    if (results.length == 1)
        return results[0];
    //console.log("no result");
    return ruleset[ruleset.length - 1]; //default
}

function checkRules2(obj, ruleset) {
    var results = [];
    //console.log("Checking rules");
    for (var i = 0; i < ruleset.length; i++) {
        if (ruleset[i].check(obj))
            return ruleset[i].result;
    }
    //console.log("No Result");
    return null
}

function Rule(result, condition) {
    this.condition = condition;
    this.result = result;
}

Rule.prototype.check = function (attrs) {
    return checkCond(attrs, this.condition);
}

function checkCond(attrs, cond) {
    var op = OPERATIONS[cond[1]],
        val = attrs[cond[0]];
    //console.log("Op:",cond[1]);
    //console.log(cond[0],val);
    return op(attrs, val, cond.slice(2));
}


TH1 = 60;
TH2 = 40;

OPERATIONS = {
    "TRUE": function (a, n, r) {
        return true;
    },
    "IN_RANGE": function (a, n, r) {
        for (var i in r)
            if (n >= r[i][0] && n < r[i][1])
                return true;
        return false;
    },
    "GREATER_THAN": function (a, n, r) {
        return n >= r;
    },
    "LESS_THAN": function (a, n, r) {
        return n < r;
    },
    "OR": function (a, n, c) {
        for (var i in c)
            if (checkCond(a, c[i]))
                return true;
        return false;
    },
    "AND": function (a, n, c) {
        for (var i in c)
            if (!checkCond(a, c[i]))
                return false;
        return true;
    }
};

RULE_CC_START = [
    new Rule(C2, ["startAngle", "IN_RANGE", [0, 10], [350, 360]]),
    new Rule(C4, ["startAngle", "IN_RANGE", [80, 350]])
];

RULE_CC_END = [
    new Rule(C3, ["endAngle", "IN_RANGE", [0, 10], [350, 360]]),
    new Rule(C7, ["endAngle", "IN_RANGE", [10, 80]]),
    new Rule(C5, ["engAngle", "IN_RANGE", [80, 100]])
];

RULE_CC_MID = [
    new Rule(C8, ["", "AND", ["inAngle", "IN_RANGE", [0, 45], [315, 360]],
        ["betweenAngle", "IN_RANGE", [0, 180]]]),
    new Rule(C8R, ["", "AND", ["inAngle", "IN_RANGE", [60, 170]], //a little ugly :| but accurate?
        ["betweenAngle", "IN_RANGE", [-180, 0]]]),
    new Rule(C9, ["", "AND", ["inAngle", "IN_RANGE", [45, 145]],
        ["betweenAngle", "IN_RANGE", [0, 180]]]),
    new Rule(C9R, ["", "AND", ["inAngle", "IN_RANGE", [0, 60], [240, 360]],
        ["betweenAngle", "IN_RANGE", [-180, 0]]])
];

RULE_BS = [ //TODO, fix the "default" case
    new Rule(DIAN, ["length", "LESS_THAN", TH2]),
    new Rule(HEN, ["startAngle", "IN_RANGE", [0, 10], [350, 360]]),
    new Rule(SHU1, ["", "AND", ["startAngle", "IN_RANGE", [80, 100]],
        ["length", "GREATER_THAN", TH1]]),
    new Rule(SHU2, ["", "AND", ["startAngle", "IN_RANGE", [80, 100]],
        ["length", "IN_RANGE", [TH2, TH1]]]), //to prevent overlap
    new Rule(NA, ["startAngle", "IN_RANGE", [10, 80]]),
    new Rule(OTHER, ["", "TRUE"])
];

// Rules
BASIC_STROKE = [
    ["startAngle", [0, 10]]
];

COMPOUND_CORNER_START = [
    ["startAngle", [0, 10], ["Result", C2]],
    ["startAngle", [80, 350], ["Result", C4]],
    ["startAngle", [350, 360], ["Result", C2]],
    null
];

COMPOUND_CORNER_MID = [
    ["inAngle", [0, 45], ["betweenAngle", [0, 180], ["Result", C8]]],
    ["inAngle", [315, 360], ["betweenAngle", [0, 180], ["Result", C8]]],
    ["inAngle", [45, 135], ["betweenAngle", [-180, -90], ["Result", C8R]]],
    ["inAngle", [45, 135], ["betweenAngle", [0, 180], ["Result", C9]]],
    ["inAngle", [45, 180], ["betweenAngle", [-90, 0], ["Result", C9R]]],
    ["inAngle", [0, 45], ["betweenAngle", [-180, 0], ["Result", C9R]]],
    ["inAngle", [315, 360], ["betweenAngle", [-180, 0], ["Result", C9R]]],
    null
];

COMPOUND_CORNER_END = [
    ["endAngle", [0, 10], ["Result", C3]],
    ["endAngle", [10, 80], ["Result", C7]],
    ["endAngle", [80, 100], ["Result", C5]],
    null
];

/* ------------------------------        examples.js        ------------------------------*/

// (ugly) Character examples for testing

//compound stroke
CSTROKE_1 = new Stroke([
    new Bezier([[50, 110], [60, 110], [190, 100], [200, 90]]),
    new Bezier([[200, 90], [205, 90], [200, 150], [195, 150]]),
    new Bezier([[195, 150], [170, 160], [120, 150], [100, 150]])
])

/* ------------------------------        Character.js        ------------------------------*/
// Angle test distance
var ANG_DIST = 0.3;

function getSegAngleStart(curve) {
    var start = curve.getStart(),
        point = curve.getPoint(curve.getPointByLength(20)),//curve.getPoint(ANG_DIST),
        dir = getAngle(sub(point, start));
    if (dir < 0)                   //No like
        dir += 2 * Math.PI;
    return dir;
}

function getSegAngleEnd(curve) {
    var end = curve.getEnd(),
        point = curve.getPoint(curve.getPointByLengthBack(20)),//curve.getPoint(1-ANG_DIST),
        dir = getAngle(sub(end, point)); //different from counterpart, maybe bad?
    if (dir < 0)
        dir += 2 * Math.PI;
    return dir;
}

/* ------------------------------        Math.js        ------------------------------*/

/*
 * A bunch of stuff
 */

function vectorSum(v1, c, v2) {
    var result = [];
    for (var i = 0; i < v1.length; i++)
        result[i] = v1[i] + c * v2[i];
    return result;
}

/**
 * Prints a matrix in row,column format
 */
function matrixPrint(matrix) {
    for (var i = 0; i < matrix.length; i++) {
        //console.log(matrix[i]);
    }
}

function zeroes(r, c) {
    var m = [];
    for (var i = 0; i < r; i++) {
        m[i] = [];
        for (var j = 0; j < c; j++)
            m[i][j] = 0;
    }
    return m;
}

//Basic matrix operations
function transpose(m) {
    var result = zeroes(m[0].length, m.length);
    for (var r = 0; r < result.length; r++) {
        for (var c = 0; c < result[0].length; c++) {
            result[r][c] = m[c][r];
        }
    }
    return result;
}

function matrixMult(m1, m2) {
    if (m1[0].length != m2.length)
        throw "Matrix dimension mismatch. Cannot multiply";

    var result = zeroes(m1.length, m2[0].length);

    for (var r = 0; r < result.length; r++) {
        for (var c = 0; c < result[0].length; c++) {
            result[r][c] = mMultHelper(m1, m2, r, c);
        }
    }
    return result;
}

function mMultHelper(m1, m2, r, c) { //does dot producting BS
    var result = 0;
    for (var i = 0; i < m1.length; i++)
        result += m1[r][i] * m2[i][c];
    return result;
}

//probably will never be used
function rowProduct(m, r) {
    var result = 1;
    for (var i = 0; i < m[0].length; i++)
        result *= m[r][i];
    return result;
}

function colProduct(m, c) {
    var result = 1;
    for (var i = 0; i < m.length; i++)
        result *= m[i][c];
    return result;
}

/** indexed row,column 
 *  DOES NOT DO ANY LEGITIMACY CHECKS OR ANYTHING
 * @param {Object} matrix
 */
function gaussianElimination1(matrix) {
    matrix = matrix.slice(0); //shallow copy (it's cool cause it's ints)

    for (var i = 0; i < matrix.length; i++) {//each row get the first coeffecient
        var temp = gElHelper1(matrix[i]),
            p = temp[0],
            a = temp[1];

        for (var j = 0; j < matrix.length; j++) { //remove from other rows
            var b = matrix[j][p];

            if (b != 0 && i != j)
                matrix[j] = vectorSum(matrix[j], -b / a, matrix[i]);
        }
    }

    //This part assumes that you end up with something in almost row echelon form (coeffecients may not be 1)    
    var result = [],
        numVars = matrix[0].length - 1;
    for (var i = 0; i < numVars; i++) { //grabbing the results
        result[i] = matrix[i][numVars] / matrix[i][i];
    }
    return result;


}
//Helper function returns the first position of a nonzero coeffecient and the coefficient itself
function gElHelper1(vector) {
    for (var i = 0; i < vector.length; i++)
        if (vector[i] != 0)
            return [i, vector[i]];
    return -1
}

function gaussianElimination(matrix) {
    matrix = matrix.slice(0);
    var numRows = matrix.length,
        numCols = matrix[0].length,
        sol = [];

    //matrixPrint(matrix);

    for (var c = 0; c < numRows; c++) {
        var iMax = gElHelper(matrix, c);

        if (matrix[iMax][c] == 0)
            throw "Matrix is singular"
        swapRows(matrix, c, iMax);

        for (var d = c + 1; d < numRows; d++) {
            var mult = matrix[d][c] / matrix[c][c];

            matrix[d] = vectorSum(matrix[d], -mult, matrix[c]);
        }
    }

    for (var r = 0; r < numRows; r++) {
        var i = numRows - r - 1;

        for (var s = r + 1; s < numRows; s++) {
            var mult = -matrix[s][i] / matrix[r][i]
            matrix[s] = vectorSum(matrix[s], mult, matrix[r]);
        }
        sol.push(matrix[r][numCols - 1] / matrix[r][i]);
    }

    return sol.reverse();
}
//Helper function finds the pos of the max in the column
function gElHelper(matrix, c) {
    var iMax = 0;
    for (var i = c; i < matrix.length; i++) {
        if (Math.abs(matrix[i][c]) > Math.abs(matrix[iMax][c]))
            iMax = i;
    }
    return iMax
}

function swapRows(matrix, r0, r1) {
    var i = matrix[r0];
    matrix[r0] = matrix[r1];
    matrix[r1] = i;
    return matrix;
}

/* ------------------------------        Vector.js        ------------------------------*/

// Math
function truncate(vector, max) {
    var mag = getMag(vector);
    if (mag > max)
        return scale(vector, max / mag);
    return vector;
}

function perp(vector) {
    return [vector[1], -vector[0]];
}

function perpNorm(vector) {
    return normalize(perp(vector));
}

function normalize(vector) {
    //if(vector[0]==0 && vector[1]==0)
    //    return [0,1];
    var mag = getMag(vector);
    return scale(vector, 1 / mag);
}

function normalizeTo(vector, mag) {
    return scale(normalize(vector), mag);
}

function projectedLength(vector, along) {
    return dot(vector, along) / getMag(along);
}

function project(vector, along) {

}

function scale(vector, factor) {
    return [vector[0] * factor, vector[1] * factor];
}

function add(vector1, vector2) {
    return [vector1[0] + vector2[0], vector1[1] + vector2[1]];
}

function sub(vector1, vector2) {
    return [vector1[0] - vector2[0], vector1[1] - vector2[1]];
}

function getMag(vector) {
    return getDist([0, 0], vector);
}

function getDist(vector1, vector2) {
    return Math.sqrt(Math.pow((vector2[0] - vector1[0]), 2) + Math.pow((vector2[1] - vector1[1]), 2));
}

function getAngle(vector) {
    var quad = 0;
    if (vector[0] === 0) // because 0 and -0 are not always the same
        vector[0] = +0;
    if (vector[0] < 0)
        quad = Math.PI;
    else if (vector[0] > 0 && vector[1] < 0)
        quad = 2 * Math.PI;
    return reduceAngle(Math.atan(vector[1] / vector[0]) + quad);
}

function getAngleBetween(vector1, vector2) {
    return Math.abs(getAngle(vector1) - getAngle(vector2));
}

function getSmallerAngle(angle) {
    if (angle > Math.PI)
        return 2 * Math.PI - angle;
    if (angle < -Math.PI)
        return -2 * Math.PI - angle
    return angle;
}

function getSmallerAngleDeg(angle) {
    if (angle > 180)
        return 360 - angle;
    if (angle < -180)
        return -360 - angle;
    return angle;
}

function radToDeg(angle) {
    return angle * 180 / Math.PI;
}

function degToRad(angle) {
    return angle * Math.PI / 180;
}

function reduceAngle(angle) {
    return angle - Math.floor(angle / (2 * Math.PI)) * 2 * Math.PI;
}

function reduceAngleDeg(angle) {
    return angle - Math.floor(angle / 360) * 360;
}

function dot(vector1, vector2) {
    return vector1[0] * vector2[0] + vector1[1] * vector2[1];
}

function point(vector, dir) {
    var mag = getMag(vector);
    return [Math.cos(dir) * mag, Math.sin(dir) * mag];
}

function rotate(v, rad) {
    var ang = getAngle(v);
    if (v[0] == 0 && v[1] == -8) {
        //console.log(v);
        //console.log("!");
        //console.log(ang);
        //console.log(rad);
        //console.log(point(v,rad+ang));
    }
    return point(v, rad + ang);
}

function midpoint(p1, p2, t) {
    return add(scale(p1, 1 - t), scale(p2, t));
}


function drawVector(vector, pos, ctx) {
    ctx.beginPath();
    ctx.moveTo(pos[0], pos[1]);
    ctx.lineTo(pos[0] + vector[0], pos[1] + vector[1]);
    ctx.stroke();
}
/* ------------------------------       PerfectFreehand      ------------------------------*/
/* ------------------------------        GetStroke.js        ------------------------------*/
/**
 * ## getStroke
 * @description Get an array of points describing a polygon that surrounds the input points.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional in both cases.
 * @param options (optional) An object with options.
 * @param options.size	The base size (diameter) of the stroke.
 * @param options.thinning The effect of pressure on the stroke's size.
 * @param options.smoothing	How much to soften the stroke's edges.
 * @param options.easing	An easing function to apply to each point's pressure.
 * @param options.simulatePressure Whether to simulate pressure based on velocity.
 * @param options.start Cap, taper and easing for the start of the line.
 * @param options.end Cap, taper and easing for the end of the line.
 * @param options.last Whether to handle the points as a completed stroke.
 */
function getStroke(points, options) {
    if (options === void 0) { options = {}; }
    return getStrokeOutlinePoints(getStrokePoints(points, options), options);
}
//# sourceMappingURL=getStroke.js.map
var __spreadArray = function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var min = Math.min, PI = Math.PI;
// This is the rate of change for simulated pressure. It could be an option.
var RATE_OF_PRESSURE_CHANGE = 0.275;
// Browser strokes seem to be off if PI is regular, a tiny offset seems to fix it
var FIXED_PI = PI + 0.0001;
/**
 * ## getStrokeOutlinePoints
 * @description Get an array of points (as `[x, y]`) representing the outline of a stroke.
 * @param points An array of StrokePoints as returned from `getStrokePoints`.
 * @param options (optional) An object with options.
 * @param options.size	The base size (diameter) of the stroke.
 * @param options.thinning The effect of pressure on the stroke's size.
 * @param options.smoothing	How much to soften the stroke's edges.
 * @param options.easing	An easing function to apply to each point's pressure.
 * @param options.simulatePressure Whether to simulate pressure based on velocity.
 * @param options.start Cap, taper and easing for the start of the line.
 * @param options.end Cap, taper and easing for the end of the line.
 * @param options.last Whether to handle the points as a completed stroke.
 */
function getStrokeOutlinePoints(points, options) {
    if (options === void 0) { options = {}; }
    var _a = options.size, size = _a === void 0 ? 16 : _a, _b = options.smoothing, smoothing = _b === void 0 ? 0.5 : _b, _c = options.thinning, thinning = _c === void 0 ? 0.5 : _c, _d = options.simulatePressure, simulatePressure = _d === void 0 ? true : _d, _e = options.easing, easing = _e === void 0 ? function (t) { return t; } : _e, _f = options.start, start = _f === void 0 ? {} : _f, _g = options.end, end = _g === void 0 ? {} : _g, _h = options.last, isComplete = _h === void 0 ? false : _h;
    var _j = start.cap, capStart = _j === void 0 ? true : _j, _k = start.taper, taperStart = _k === void 0 ? 0 : _k, _l = start.easing, taperStartEase = _l === void 0 ? function (t) { return t * (2 - t); } : _l;
    var _m = end.cap, capEnd = _m === void 0 ? true : _m, _o = end.taper, taperEnd = _o === void 0 ? 0 : _o, _p = end.easing, taperEndEase = _p === void 0 ? function (t) { return --t * t * t + 1; } : _p;
    // We can't do anything with an empty array or a stroke with negative size.
    if (points.length === 0 || size <= 0) {
        return [];
    }
    // The total length of the line
    var totalLength = points[points.length - 1].runningLength;
    // The minimum allowed distance between points (squared)
    var minDistance = Math.pow(size * smoothing, 2);
    // Our collected left and right points
    var leftPts = [];
    var rightPts = [];
    // Previous pressure (start with average of first five pressures,
    // in order to prevent fat starts for every line. Drawn lines
    // almost always start slow!
    var prevPressure = points.slice(0, 10).reduce(function (acc, curr) {
        var pressure = curr.pressure;
        if (simulatePressure) {
            // Speed of change - how fast should the the pressure changing?
            var sp = min(1, curr.distance / size);
            // Rate of change - how much of a change is there?
            var rp = min(1, 1 - sp);
            // Accelerate the pressure
            pressure = min(1, acc + (rp - acc) * (sp * RATE_OF_PRESSURE_CHANGE));
        }
        return (acc + pressure) / 2;
    }, points[0].pressure);
    // The current radius
    var radius = getStrokeRadius(size, thinning, points[points.length - 1].pressure, easing);
    // The radius of the first saved point
    var firstRadius = undefined;
    // Previous vector
    var prevVector = points[0].vector;
    // Previous left and right points
    var pl = points[0].point;
    var pr = pl;
    // Temporary left and right points
    var tl = pl;
    var tr = pr;
    // let short = true
    /*
      Find the outline's left and right points
  
      Iterating through the points and populate the rightPts and leftPts arrays,
      skipping the first and last pointsm, which will get caps later on.
    */
    for (var i = 0; i < points.length; i++) {
        var pressure = points[i].pressure;
        var _q = points[i], point = _q.point, vector = _q.vector, distance = _q.distance, runningLength = _q.runningLength;
        // Removes noise from the end of the line
        if (i < points.length - 1 && totalLength - runningLength < 3) {
            continue;
        }
        /*
          Calculate the radius
    
          If not thinning, the current point's radius will be half the size; or
          otherwise, the size will be based on the current (real or simulated)
          pressure.
        */
        if (thinning) {
            if (simulatePressure) {
                // If we're simulating pressure, then do so based on the distance
                // between the current point and the previous point, and the size
                // of the stroke. Otherwise, use the input pressure.
                var sp = min(1, distance / size);
                var rp = min(1, 1 - sp);
                pressure = min(1, prevPressure + (rp - prevPressure) * (sp * RATE_OF_PRESSURE_CHANGE));
            }
            radius = getStrokeRadius(size, thinning, pressure, easing);
        }
        else {
            radius = size / 2;
        }
        if (firstRadius === undefined) {
            firstRadius = radius;
        }
        /*
          Apply tapering
    
          If the current length is within the taper distance at either the
          start or the end, calculate the taper strengths. Apply the smaller
          of the two taper strengths to the radius.
        */
        var ts = runningLength < taperStart
            ? taperStartEase(runningLength / taperStart)
            : 1;
        var te = totalLength - runningLength < taperEnd
            ? taperEndEase((totalLength - runningLength) / taperEnd)
            : 1;
        radius = Math.max(0.01, radius * Math.min(ts, te));
        /* Add points to left and right */
        // Handle the last point
        if (i === points.length - 1) {
            var offset_1 = mul(per(vector), radius);
            leftPts.push(sub(point, offset_1));
            rightPts.push(add(point, offset_1));
            continue;
        }
        var nextVector = points[i + 1].vector;
        var nextDpr = dpr(vector, nextVector);
        /*
          Handle sharp corners
    
          Find the difference (dot product) between the current and next vector.
          If the next vector is at more than a right angle to the current vector,
          draw a cap at the current point.
        */
        if (nextDpr < 0) {
            // It's a sharp corner. Draw a rounded cap and move on to the next point
            // Considering saving these and drawing them later? So that we can avoid
            // crossing future points.
            var offset_2 = mul(per(prevVector), radius);
            for (var step = 1 / 13, t = 0; t <= 1; t += step) {
                tl = rotAround(sub(point, offset_2), point, FIXED_PI * t);
                leftPts.push(tl);
                tr = rotAround(add(point, offset_2), point, FIXED_PI * -t);
                rightPts.push(tr);
            }
            pl = tl;
            pr = tr;
            continue;
        }
        /*
          Add regular points
    
          Project points to either side of the current point, using the
          calculated size as a distance. If a point's distance to the
          previous point on that side greater than the minimum distance
          (or if the corner is kinda sharp), add the points to the side's
          points array.
        */
        var offset = mul(per(lrp(nextVector, vector, nextDpr)), radius);
        tl = sub(point, offset);
        if (i <= 1 || dist2(pl, tl) > minDistance) {
            leftPts.push(tl);
            pl = tl;
        }
        tr = add(point, offset);
        if (i <= 1 || dist2(pr, tr) > minDistance) {
            rightPts.push(tr);
            pr = tr;
        }
        // Set variables for next iteration
        prevPressure = pressure;
        prevVector = vector;
    }
    /*
      Drawing caps
      
      Now that we have our points on either side of the line, we need to
      draw caps at the start and end. Tapered lines don't have caps, but
      may have dots for very short lines.
    */
    var firstPoint = points[0].point.slice(0, 2);
    var lastPoint = points.length > 1
        ? points[points.length - 1].point.slice(0, 2)
        : add(points[0].point, [1, 1]);
    var startCap = [];
    var endCap = [];
    /*
      Draw a dot for very short or completed strokes
      
      If the line is too short to gather left or right points and if the line is
      not tapered on either side, draw a dot. If the line is tapered, then only
      draw a dot if the line is both very short and complete. If we draw a dot,
      we can just return those points.
    */
    if (convertDotStrokes == true && points.length === 1) {
        if (!(taperStart || taperEnd) || isComplete) {
            var start_1 = prj(firstPoint, uni(per(sub(firstPoint, lastPoint))), -(firstRadius || radius));
            var dotPts = [];
            for (var step = 1 / 13, t = step; t <= 1; t += step) {
                dotPts.push(rotAround(start_1, firstPoint, FIXED_PI * 2 * t));
            }
            return dotPts;
        }
    }
    else {
        /*
        Draw a start cap
    
        Unless the line has a tapered start, or unless the line has a tapered end
        and the line is very short, draw a start cap around the first point. Use
        the distance between the second left and right point for the cap's radius.
        Finally remove the first left and right points. :psyduck:
      */
        if (taperStart || (taperEnd && points.length === 1)) {
            // The start point is tapered, noop
        }
        else if (capStart) {
            // Draw the round cap - add thirteen points rotating the right point around the start point to the left point
            for (var step = 1 / 13, t = step; t <= 1; t += step) {
                var pt = rotAround(rightPts[0], firstPoint, FIXED_PI * t);
                startCap.push(pt);
            }
        }
        else {
            // Draw the flat cap - add a point to the left and right of the start point
            var cornersVector = sub(leftPts[0], rightPts[0]);
            var offsetA = mul(cornersVector, 0.5);
            var offsetB = mul(cornersVector, 0.51);
            startCap.push(sub(firstPoint, offsetA), sub(firstPoint, offsetB), add(firstPoint, offsetB), add(firstPoint, offsetA));
        }
        /*
        Draw an end cap
    
        If the line does not have a tapered end, and unless the line has a tapered
        start and the line is very short, draw a cap around the last point. Finally,
        remove the last left and right points. Otherwise, add the last point. Note
        that This cap is a full-turn-and-a-half: this prevents incorrect caps on
        sharp end turns.
      */
        var direction = per(neg(points[points.length - 1].vector));
        if (taperEnd || (taperStart && points.length === 1)) {
            // Tapered end - push the last point to the line
            endCap.push(lastPoint);
        }
        else if (capEnd) {
            // Draw the round end cap
            var start_2 = prj(lastPoint, direction, radius);
            for (var step = 1 / 29, t = step; t < 1; t += step) {
                endCap.push(rotAround(start_2, lastPoint, FIXED_PI * 3 * t));
            }
        }
        else {
            // Draw the flat end cap
            endCap.push(add(lastPoint, mul(direction, radius)), add(lastPoint, mul(direction, radius * 0.99)), sub(lastPoint, mul(direction, radius * 0.99)), sub(lastPoint, mul(direction, radius)));
        }
    }
    /*
      Return the points in the correct winding order: begin on the left side, then
      continue around the end cap, then come back along the right side, and finally
      complete the start cap.
    */
    return leftPts.concat(endCap, rightPts.reverse(), startCap);
}

function getStrokePoints(points, options) {
    var _a;
    if (options === void 0) { options = {}; }
    var _b = options.streamline, streamline = _b === void 0 ? 0.5 : _b, _c = options.size, size = _c === void 0 ? 16 : _c, _d = options.last, isComplete = _d === void 0 ? false : _d;
    // If we don't have any points, return an empty array.
    if (points.length === 0)
        return [];
    // Find the interpolation level between points.
    var t = 0.15 + (1 - streamline) * 0.85;
    // Whatever the input is, make sure that the points are in number[][].
    var pts = Array.isArray(points[0])
        ? points
        : points.map(function (_a) {
            var x = _a.x, y = _a.y, _b = _a.pressure, pressure = _b === void 0 ? 0.5 : _b;
            return [x, y, pressure];
        });
    // Add extra points between the two, to help avoid "dash" lines
    // for strokes with tapered start and ends. Don't mutate the
    // input array!
    if (pts.length === 2) {
        var last = pts[1];
        pts = pts.slice(0, -1);
        for (var i = 1; i < 5; i++) {
            pts.push(lrp(pts[0], last, i / 4));
        }
    }
    // If there's only one point, add another point at a 1pt offset.
    // Don't mutate the input array!
    if (pts.length === 1) {
        pts = __spreadArray(__spreadArray([], pts, true), [__spreadArray(__spreadArray([], add(pts[0], [1, 1]), true), pts[0].slice(2), true)], false);
    }
    // The strokePoints array will hold the points for the stroke.
    // Start it out with the first point, which needs no adjustment.
    var strokePoints = [
        {
            point: [pts[0][0], pts[0][1]],
            pressure: pts[0][2] >= 0 ? pts[0][2] : 0.25,
            vector: [1, 1],
            distance: 0,
            runningLength: 0,
        },
    ];
    // A flag to see whether we've already reached out minimum length
    var hasReachedMinimumLength = false;
    // We use the runningLength to keep track of the total distance
    var runningLength = 0;
    // We're set this to the latest point, so we can use it to calculate
    // the distance and vector of the next point.
    var prev = strokePoints[0];
    var max = pts.length - 1;
    // Iterate through all of the points, creating StrokePoints.
    for (var i = 1; i < pts.length; i++) {
        var point = isComplete && i === max
            ? // If we're at the last point, and `options.last` is true,
            // then add the actual input point.
            pts[i].slice(0, 2)
            : // Otherwise, using the t calculated from the streamline
            // option, interpolate a new point between the previous
            // point the current point.
            lrp(prev.point, pts[i], t);
        // If the new point is the same as the previous point, skip ahead.
        if (isEqual(prev.point, point))
            continue;
        // How far is the new point from the previous point?
        var distance = dist(point, prev.point);
        // Add this distance to the total "running length" of the line.
        runningLength += distance;
        // At the start of the line, we wait until the new point is a
        // certain distance away from the original point, to avoid noise
        if (i < max && !hasReachedMinimumLength) {
            if (runningLength < size)
                continue;
            hasReachedMinimumLength = true;
            // TODO: Backfill the missing points so that tapering works correctly.
        }
        // Create a new strokepoint (it will be the new "previous" one).
        prev = {
            // The adjusted point
            point: point,
            // The input pressure (or .5 if not specified)
            pressure: pts[i][2] >= 0 ? pts[i][2] : 0.5,
            // The vector from the current point to the previous point
            vector: uni(sub(prev.point, point)),
            // The distance between the current point and the previous point
            distance: distance,
            // The total distance so far
            runningLength: runningLength,
        };
        // Push it to the strokePoints array.
        strokePoints.push(prev);
    }
    // Set the vector of the first point to be the same as the second point.
    strokePoints[0].vector = ((_a = strokePoints[1]) === null || _a === void 0 ? void 0 : _a.vector) || [0, 0];
    return strokePoints;
}
function getStrokeRadius(size, thinning, pressure, easing) {
    if (easing === void 0) { easing = function (t) { return t; }; }
    return size * easing(0.5 - thinning * (0.5 - pressure));
}

/**
 * Negate a vector.
 * @param A
 * @internal
 */
function neg(A) {
    return [-A[0], -A[1]];
}
/**
 * Add vectors.
 * @param A
 * @param B
 * @internal
 */
function add(A, B) {
    return [A[0] + B[0], A[1] + B[1]];
}
/**
 * Subtract vectors.
 * @param A
 * @param B
 * @internal
 */
function sub(A, B) {
    return [A[0] - B[0], A[1] - B[1]];
}
/**
 * Vector multiplication by scalar
 * @param A
 * @param n
 * @internal
 */
function mul(A, n) {
    return [A[0] * n, A[1] * n];
}
/**
 * Vector division by scalar.
 * @param A
 * @param B
 * @internal
 */
function div(A, n) {
    return [A[0] / n, A[1] / n];
}
/**
 * Perpendicular rotation of a vector A
 * @param A
 * @internal
 */
function per(A) {
    return [A[1], -A[0]];
}
/**
 * Dot product
 * @param A
 * @param B
 * @internal
 */
function dpr(A, B) {
    return A[0] * B[0] + A[1] * B[1];
}
/**
 * Get whether two vectors are equal.
 * @param A
 * @param B
 * @internal
 */
function isEqual(A, B) {
    return A[0] === B[0] && A[1] === B[1];
}
/**
 * Length of the vector
 * @param A
 * @internal
 */
function len(A) {
    return Math.hypot(A[0], A[1]);
}
/**
 * Length of the vector squared
 * @param A
 * @internal
 */
function len2(A) {
    return A[0] * A[0] + A[1] * A[1];
}
/**
 * Dist length from A to B squared.
 * @param A
 * @param B
 * @internal
 */
function dist2(A, B) {
    return len2(sub(A, B));
}
/**
 * Get normalized / unit vector.
 * @param A
 * @internal
 */
function uni(A) {
    return div(A, len(A));
}
/**
 * Dist length from A to B
 * @param A
 * @param B
 * @internal
 */
function dist(A, B) {
    return Math.hypot(A[1] - B[1], A[0] - B[0]);
}
/**
 * Mean between two vectors or mid vector between two vectors
 * @param A
 * @param B
 * @internal
 */
function med(A, B) {
    return mul(add(A, B), 0.5);
}
/**
 * Rotate a vector around another vector by r (radians)
 * @param A vector
 * @param C center
 * @param r rotation in radians
 * @internal
 */
function rotAround(A, C, r) {
    var s = Math.sin(r);
    var c = Math.cos(r);
    var px = A[0] - C[0];
    var py = A[1] - C[1];
    var nx = px * c - py * s;
    var ny = px * s + py * c;
    return [nx + C[0], ny + C[1]];
}
/**
 * Interpolate vector A to B with a scalar t
 * @param A
 * @param B
 * @param t scalar
 * @internal
 */
function lrp(A, B, t) {
    return add(A, mul(sub(B, A), t));
}
/**
 * Project a point A in the direction B by a scalar c
 * @param A
 * @param B
 * @param c
 * @internal
 */
function prj(A, B, c) {
    return add(A, mul(B, c));
}

function handleEraserDrag(e) {
    if (!isEraserDragging) return;

    var clickPoint = [e.offsetX, e.offsetY];
    var strokeRemoved = false;

    // 反向遍历所有笔画
    for (var i = arrays_of_points.length - 1; i >= 0; i--) {
        if (isPointInStroke(clickPoint, arrays_of_points[i])) {
            // 保存被擦除的笔画信息
            erasedStrokes.push({
                points: arrays_of_points[i],
                perfectCache: perfect_cache[i],
                lineType: line_type_history[i],
                index: i
            });

            // 删除笔画
            arrays_of_points.splice(i, 1);
            perfect_cache.splice(i, 1);
            line_type_history.splice(i, 1);

            strokeRemoved = true;
            break;
        }
    }

    // 检查书法笔画
    if (!strokeRemoved && typeof strokes !== 'undefined' && strokes.length > 0) {
        for (var i = strokes.length - 1; i >= 0; i--) {
            if (isPointNearCalligraphyStroke(clickPoint, strokes[i])) {
                // 保存被擦除的书法笔画
                erasedStrokes.push({
                    calligraphyStroke: strokes[i],
                    index: i,
                    lineType: 'C'
                });

                strokes.splice(i, 1);
                strokeRemoved = true;
                break;
            }
        }
    }

    // 如果有笔迹被移除，重绘画布
    if (strokeRemoved) {
        // 添加擦除操作到历史记录
        line_type_history.push('E'); // 'E' 表示 Eraser操作
        ts_undo_button.className = "active"; // 激活撤销按钮

        // 设置操作类型为擦除
        strokeOperation = 'E';

        // 检查是否所有笔迹都被擦除
        if (arrays_of_points.length === 0 && strokes.length === 0) {
            // 重置nextLine和nextPoint，确保下一次绘制正确开始
            nextLine = 0;
            nextPoint = 0;
            nextStroke = 0;
        }

        // 重绘画布
        ts_redraw();

        // 标记笔迹已变化，触发保存
        if (typeof strokesChanged !== 'undefined' && typeof save_strokes_debounced === 'function') {
            strokesChanged = true;
            save_strokes_debounced();
            console.log('AnkiDraw Debug: 橡皮擦操作完成，触发保存');
        }
    }
}

function switch_line_mode() {
    stop_drawing();
    lineMode = !lineMode;
    var lineButton = document.getElementById('ts_line_button');
    var ts_write_button = document.getElementById('ts_write_button');
    if (lineMode) {
        lineButton.className = 'active';

        // 确保直线工具的属性在第一次使用时有合理的默认值
        if (lineColor === '#fff' && color !== '#fff') {
            lineColor = color; // 如果直线颜色未设置，则继承当前画笔颜色
        }
        if (lineWidth === 4 && line_width !== 4) {
            lineWidth = line_width; // 如果直线线宽未设置，则继承当前画笔线宽
        }

        // 应用直线工具设置
        update_line_settings();

        // Deactivate other modes
        ts_perfect_freehand_button.className = '';
        perfectFreehand = false;
        ts_kanji_button.className = '';
        ts_write_button.className = '';
        calligraphy = false;
        if (eraserMode) {
            toggleEraser(false);
        }
        // 如果笔端擦除模式活跃，禁用它
        isPenEraserActive = false;

        // 如果矩形模式活跃，禁用它
        if (rectangleMode) {
            rectangleMode = false;
            document.getElementById('ts_rectangle_button').className = '';
        }
    } else {
        lineButton.className = '';
        ts_write_button.className = 'active';
    }
}

/**
 * 设置直线样式
 * @param {string} style - 样式类型：solid(实线)、dashed(虚线)、wavy(波浪线)
 */
function setLineStyle(style) {
    lineStyle = style;

    // 根据样式设置虚线模式
    if (style === 'dashed') {
        lineDashPattern = [10, 5]; // 10像素实线，5像素空白
    } else if (style === 'wavy') {
        lineDashPattern = []; // 波浪线不使用虚线模式
    } else {
        // 实线
        lineDashPattern = [];
    }

    // 更新直线设置
    update_line_settings();

    // 保存设置
    if (typeof pycmd === 'function') {
        pycmd('ankidraw_save_line_style:' + style);
    }
}

/**
 * 创建直线样式选择器
 */
function createLineStyleSlider() {
    if (!lineStyleSlider) {
        // 创建容器
        var sliderContainer = document.createElement('div');
        sliderContainer.id = 'line-style-slider-container';
        sliderContainer.style.position = 'fixed';
        sliderContainer.style.zIndex = '9998';
        sliderContainer.style.background = 'rgba(0, 0, 0, 0.5)';
        sliderContainer.style.padding = '10px';
        sliderContainer.style.borderRadius = '5px';
        sliderContainer.style.display = 'none';
        sliderContainer.style.transition = '0.3s';
        sliderContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        sliderContainer.style.opacity = '0.5';

        // 添加标题
        var sliderTitle = document.createElement('div');
        sliderTitle.textContent = 'Line Style';
        sliderTitle.style.color = 'white';
        sliderTitle.style.fontSize = '12px';
        sliderTitle.style.marginBottom = '5px';
        sliderTitle.style.textAlign = 'center';
        sliderContainer.appendChild(sliderTitle);

        // 创建样式选项容器
        var styleOptions = document.createElement('div');
        styleOptions.style.display = 'flex';
        styleOptions.style.flexDirection = 'column';
        styleOptions.style.gap = '8px';

        // 样式选项：实线
        var solidOption = createStyleOption('solid', 'Solid');

        // 样式选项：虚线
        var dashedOption = createStyleOption('dashed', 'Dashed');

        // 样式选项：波浪线
        var wavyOption = createStyleOption('wavy', 'Wavy');

        // 添加样式选项到容器
        styleOptions.appendChild(solidOption);
        styleOptions.appendChild(dashedOption);
        styleOptions.appendChild(wavyOption);
        sliderContainer.appendChild(styleOptions);

        // 鼠标进入容器时清除自动隐藏计时器和增加不透明度
        sliderContainer.addEventListener('mouseenter', function () {
            clearTimeout(lineStyleSliderTimeout);
            this.style.opacity = '1';
            this.style.transform = 'scale(1.05)';
        });

        // 鼠标离开容器时设置自动隐藏和恢复透明度
        sliderContainer.addEventListener('mouseleave', function () {
            this.style.opacity = '0.5';
            this.style.transform = 'scale(1)';
            startLineStyleSliderHideTimer();
        });

        // 将容器添加到文档
        document.body.appendChild(sliderContainer);
        lineStyleSlider = sliderContainer;
    }

    return lineStyleSlider;
}

/**
 * 创建样式选项
 * @param {string} style - 样式名称
 * @param {string} label - 样式显示文本
 * @returns {HTMLElement} - 样式选项元素
 */
function createStyleOption(style, label) {
    var option = document.createElement('div');
    option.className = 'line-style-option';
    option.dataset.style = style;
    option.style.display = 'flex';
    option.style.alignItems = 'center';
    option.style.cursor = 'pointer';
    option.style.padding = '5px';
    option.style.borderRadius = '3px';
    option.style.transition = '0.2s';

    // 当前选中的样式添加高亮
    if (style === lineStyle) {
        option.style.background = 'rgba(33, 150, 243, 0.3)';
    }

    // 样式示例
    var preview = document.createElement('div');
    preview.style.width = '30px';
    preview.style.height = '20px';
    preview.style.marginRight = '10px';
    preview.style.position = 'relative';

    // 为不同样式创建不同的预览
    var previewLine = document.createElement('div');
    previewLine.style.position = 'absolute';
    previewLine.style.top = '50%';
    previewLine.style.left = '0';
    previewLine.style.right = '0';
    previewLine.style.height = '2px';
    previewLine.style.background = 'white';

    if (style === 'solid') {
        // 实线不需要特殊处理
    } else if (style === 'dashed') {
        // 虚线效果
        previewLine.style.borderTop = '2px dashed white';
        previewLine.style.background = 'transparent';
    } else if (style === 'wavy') {
        // 波浪线效果
        previewLine.style.borderTop = '2px solid transparent';
        previewLine.style.background = 'transparent';
        previewLine.style.height = '6px';

        // 更新SVG波浪预览以使其更加明显
        var svg = `<svg width="30" height="6" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,3 Q2,1 4,5 Q6,1 8,5 Q10,1 12,5 Q14,1 16,5 Q18,1 20,5 Q22,1 24,5 Q26,1 28,5 Q30,3" stroke="white" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        var encoded = encodeURIComponent(svg);
        previewLine.style.backgroundImage = `url("data:image/svg+xml;charset=utf-8,${encoded}")`;
        previewLine.style.backgroundRepeat = 'no-repeat';
    }

    preview.appendChild(previewLine);

    // 样式文本 - 使用英文标签
    var text = document.createElement('span');
    if (style === 'solid') {
        text.textContent = 'Solid';
    } else if (style === 'dashed') {
        text.textContent = 'Dashed';
    } else if (style === 'wavy') {
        text.textContent = 'Wavy';
    } else {
        text.textContent = label;
    }
    text.style.color = 'white';
    text.style.fontSize = '12px';

    option.appendChild(preview);
    option.appendChild(text);

    // 添加点击事件
    option.addEventListener('click', function () {
        setLineStyle(style);

        // 更新所有选项的样式
        var options = document.querySelectorAll('.line-style-option');
        options.forEach(function (opt) {
            if (opt.dataset.style === style) {
                opt.style.background = 'rgba(33, 150, 243, 0.3)';
            } else {
                opt.style.background = 'transparent';
            }
        });

        // 立即隐藏滚动条
        hideLineStyleSlider();
    });

    // 添加悬停效果
    option.addEventListener('mouseenter', function () {
        if (this.dataset.style !== lineStyle) {
            this.style.background = 'rgba(255, 255, 255, 0.1)';
        }
    });

    option.addEventListener('mouseleave', function () {
        if (this.dataset.style !== lineStyle) {
            this.style.background = 'transparent';
        }
    });

    return option;
}

/**
 * 显示直线样式选择器
 */
function showLineStyleSlider() {
    var sliderContainer = createLineStyleSlider();

    // 清除可能存在的隐藏计时器
    clearTimeout(lineStyleSliderTimeout);

    // 获取工具栏位置
    var toolbarElem = document.getElementById('pencil_button_bar');
    var lineButton = document.getElementById('ts_line_button');

    if (toolbarElem && lineButton) {
        var toolbarRect = toolbarElem.getBoundingClientRect();
        var buttonRect = lineButton.getBoundingClientRect();

        // 首先显示滑块以获取其尺寸
        sliderContainer.style.display = 'block';
        sliderContainer.style.visibility = 'hidden';

        // 获取滑块的尺寸
        var sliderWidth = sliderContainer.offsetWidth;
        var sliderHeight = sliderContainer.offsetHeight;

        // 计算初始位置
        var initialLeft, initialTop;

        // 根据工具栏位置决定滚动条位置
        if (toolbarRect.left < window.innerWidth / 2) {
            // 工具栏在左侧，滚动条显示在右侧
            initialLeft = buttonRect.right + 10;
            initialTop = buttonRect.top;
        } else {
            // 工具栏在右侧，滚动条显示在左侧
            initialLeft = buttonRect.left - sliderWidth - 10;
            initialTop = buttonRect.top;
        }

        // 确保滑块在视口内
        // 限制右边界
        if (initialLeft + sliderWidth > window.innerWidth) {
            initialLeft = window.innerWidth - sliderWidth - 10;
        }

        // 限制左边界
        if (initialLeft < 0) {
            initialLeft = 10;
        }

        // 限制底部边界
        if (initialTop + sliderHeight > window.innerHeight) {
            initialTop = window.innerHeight - sliderHeight - 10;
        }

        // 限制顶部边界
        if (initialTop < 0) {
            initialTop = 10;
        }

        // 设置位置
        sliderContainer.style.left = initialLeft + 'px';
        sliderContainer.style.top = initialTop + 'px';
        sliderContainer.style.visibility = 'visible';
    } else {
        // 默认位置
        sliderContainer.style.left = '10px';
        sliderContainer.style.top = '10px';
        sliderContainer.style.visibility = 'visible';
    }

    // 显示选择器
    sliderContainer.style.display = 'block';

    // 设置自动隐藏计时器
    startLineStyleSliderHideTimer();
}

/**
 * 开始计时隐藏直线样式选择器
 */
function startLineStyleSliderHideTimer() {
    // 清除可能存在的计时器
    clearTimeout(lineStyleSliderTimeout);

    // 设置3秒后隐藏
    lineStyleSliderTimeout = setTimeout(function () {
        hideLineStyleSlider();
    }, 3000);
}

/**
 * 隐藏直线样式选择器
 */
function hideLineStyleSlider() {
    if (lineStyleSlider) {
        lineStyleSlider.style.display = 'none';
    }
}

/**
 * 设置直线工具按钮的双击事件
 */
function setupLineStyleEvents() {
    // 设置直线按钮的双击事件
    var lineButton = document.getElementById('ts_line_button');
    if (lineButton) {
        // 移除可能存在的旧事件处理器
        lineButton.removeEventListener('dblclick', handleLineButtonDblClick);

        // 添加双击事件处理器
        lineButton.addEventListener('dblclick', handleLineButtonDblClick);
    }

    // 添加点击空白处隐藏选择器的事件处理
    document.addEventListener('click', function (e) {
        // 如果选择器存在且可见
        if (lineStyleSlider && lineStyleSlider.style.display === 'block') {
            // 检查点击是否在选择器容器外
            var isOutsideSlider = !lineStyleSlider.contains(e.target);
            // 检查点击是否不是直线按钮（避免与双击事件冲突）
            var isNotLineButton = lineButton && !lineButton.contains(e.target);

            if (isOutsideSlider && isNotLineButton) {
                // 点击在选择器外部，立即隐藏选择器
                hideLineStyleSlider();
            }
        }
    });
}

/**
 * 处理直线按钮的双击事件
 * @param {MouseEvent} e - 鼠标事件
 */
function handleLineButtonDblClick(e) {
    e.preventDefault();
    e.stopPropagation();

    // 确保直线模式已激活
    if (!lineMode) {
        switch_line_mode(); // 如果未激活，则激活直线模式
    }

    // 显示样式选择面板
    showLineStyleSlider();
}

// 当DOM加载完成后，设置直线样式事件
document.addEventListener('DOMContentLoaded', function () {
    setupLineStyleEvents();
});

// 如果DOM已经加载完成，立即设置
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupLineStyleEvents();
}

// 设置直线颜色
function set_line_color(newColor) {
    lineColor = newColor;
    update_line_settings();
}

// 设置直线线宽
function set_line_width(newWidth) {
    lineWidth = newWidth;
    update_line_settings();
}

// 设置普通画笔颜色
function set_pen_color(newColor) {
    color = newColor;
    update_pen_settings();
}

// 设置普通画笔线宽
function set_pen_width(newWidth) {
    line_width = newWidth;
    update_pen_settings();
}

// 处理Surface Pen笔端擦除按下事件
function handlePenEraser(e) {
    // 如果是触摸事件，直接返回，不处理橡皮擦
    if (e.pointerType === 'touch') {
        return;
    }

    // 检查是否是Surface Pen (pointerType为"pen")并且使用笔端擦除按钮(button为5)
    if (e.pointerType === 'pen' && e.button === 5) {
        e.preventDefault();
        e.stopPropagation();

        // 阻止事件继续传播到其他处理程序
        if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
        }

        isPenEraserActive = true;

        // 确保常规橡皮擦按钮显示为非激活状态，无论它之前状态如何
        var eraserButton = document.getElementById('ts_eraser_button');
        if (eraserButton && eraserButton.classList.contains('active')) {
            // 禁用常规橡皮擦模式，但不调用toggleEraser()以避免影响当前的笔端擦除操作
            eraserButton.classList.remove('active');

            // 如果eraserMode是全局变量，确保它也得到更新，但保持笔端擦除功能不受影响
            if (typeof eraserMode !== 'undefined') {
                // 保存当前状态以便在笔端擦除结束后可以恢复
                window.previousEraserMode = eraserMode;
                eraserMode = false;
            }
        }

        // 如果正在绘制矩形，取消矩形绘制
        if (isDrawingRect) {
            isDrawingRect = false;
            secondary_ctx.clearRect(0, 0, secondary_canvas.width, secondary_canvas.height);
        }

        // 暂时移除矩形工具事件监听器，避免同时绘制矩形
        if (rectangleMode && typeof pointerDownRectangle === 'function') {
            canvas.removeEventListener('pointerdown', pointerDownRectangle);
            canvas.removeEventListener('pointermove', pointerMoveRectangle);
            window.removeEventListener('pointerup', pointerUpRectangle);
        }

        // 如果最后一次绘制是一个孤立的点（可能是擦除开始时意外创建的）
        // 检查是否已经绘制了点并且是最新添加的
        if (arrays_of_points.length > 0) {
            var lastStroke = arrays_of_points[arrays_of_points.length - 1];
            // 如果最后一笔只有一个点或两个非常接近的点，并且是刚刚添加的（不到50ms前）
            if (lastStroke.length <= 2 && Date.now() - e.timeStamp < 50) {
                // 删除这个可能是由擦除操作触发的点
                arrays_of_points.pop();
                perfect_cache.pop();
                line_type_history.pop();
                ts_redraw(); // 重绘以消除这个点
            }
        }

        // 立即处理擦除操作
        handlePenEraserDrag(e);
    }
}

// 处理Surface Pen笔端擦除移动事件
function handlePenEraserMove(e) {
    // 如果是触摸事件，直接返回，不处理橡皮擦
    if (e.pointerType === 'touch') {
        return;
    }

    if (isPenEraserActive && e.pointerType === 'pen') {
        e.preventDefault();
        e.stopPropagation();

        // 阻止事件继续传播到其他处理程序
        if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
        }

        // 确保在移动过程中橡皮擦按钮保持非激活状态
        var eraserButton = document.getElementById('ts_eraser_button');
        if (eraserButton && eraserButton.classList.contains('active')) {
            eraserButton.classList.remove('active');
        }

        handlePenEraserDrag(e);
    }
}

// 停止Surface Pen笔端擦除
function stopPenEraser(e) {
    // 如果是触摸事件，直接返回，不处理橡皮擦
    if (e.pointerType === 'touch') {
        return;
    }

    if (e.pointerType === 'pen' && e.button === 5) {
        isPenEraserActive = false;

        // 恢复矩形工具事件监听器（如果矩形模式仍然激活）
        if (rectangleMode && typeof pointerDownRectangle === 'function') {
            canvas.addEventListener('pointerdown', pointerDownRectangle);
            canvas.addEventListener('pointermove', pointerMoveRectangle);
            window.addEventListener('pointerup', pointerUpRectangle);
        }

        // 检查是否需要恢复之前的橡皮擦状态
        if (window.previousEraserMode === true) {
            // 如果之前橡皮擦是激活的，恢复其状态，但使用UI更新而不是toggleEraser函数
            var eraserButton = document.getElementById('ts_eraser_button');
            if (eraserButton) {
                eraserButton.classList.add('active');
            }

            // 恢复eraserMode全局变量
            if (typeof eraserMode !== 'undefined') {
                eraserMode = true;
            }

            // 清除保存的状态
            window.previousEraserMode = undefined;
        }

        // 如果之前有擦除操作，确保保存笔迹
        if (line_type_history.includes('E')) {
            // 标记笔迹已变化，触发保存
            strokesChanged = true;
            save_strokes_debounced();
            console.log('AnkiDraw Debug: 笔尖擦除器停止使用，触发保存');
        }
    }
}

// 处理Surface Pen笔端擦除拖动
function handlePenEraserDrag(e) {
    // 如果是触摸事件，直接返回，不处理橡皮擦
    if (e && e.pointerType === 'touch') {
        return;
    }

    if (!isPenEraserActive) return;

    var rect = canvas.getBoundingClientRect();
    var clickPoint = [e.clientX - rect.left, e.clientY - rect.top];
    var strokeRemoved = false;

    // 反向遍历所有笔画
    for (var i = arrays_of_points.length - 1; i >= 0; i--) {
        if (isPointInStroke(clickPoint, arrays_of_points[i])) {
            // 保存被擦除的笔画信息
            if (typeof erasedStrokes !== 'undefined') {
                erasedStrokes.push({
                    points: arrays_of_points[i],
                    perfectCache: perfect_cache[i],
                    lineType: line_type_history[i],
                    index: i
                });
            }

            // 删除笔画
            arrays_of_points.splice(i, 1);
            perfect_cache.splice(i, 1);
            line_type_history.splice(i, 1);

            strokeRemoved = true;
            break;
        }
    }

    // 检查书法笔画
    if (!strokeRemoved && typeof strokes !== 'undefined' && strokes.length > 0) {
        for (var i = strokes.length - 1; i >= 0; i--) {
            if (isPointNearCalligraphyStroke(clickPoint, strokes[i])) {
                // 保存被擦除的书法笔画
                if (typeof erasedStrokes !== 'undefined') {
                    erasedStrokes.push({
                        calligraphyStroke: strokes[i],
                        index: i,
                        lineType: 'C'
                    });
                }

                strokes.splice(i, 1);
                strokeRemoved = true;
                break;
            }
        }
    }

    // 检查直线
    if (!strokeRemoved) {
        for (var i = arrays_of_points.length - 1; i >= 0; i--) {
            // 检查是否是直线（只有两个点的笔迹）
            if (arrays_of_points[i].length === 2) {
                var lineStart = arrays_of_points[i][0];
                var lineEnd = arrays_of_points[i][1];

                // 检查点击点是否接近线段
                if (distanceToSegment(
                    { x: clickPoint[0], y: clickPoint[1] },
                    { x: lineStart[0], y: lineStart[1] },
                    { x: lineEnd[0], y: lineEnd[1] }
                ) <= 10) { // 10像素的容差
                    // 保存被擦除的直线
                    if (typeof erasedStrokes !== 'undefined') {
                        erasedStrokes.push({
                            points: arrays_of_points[i],
                            perfectCache: perfect_cache[i],
                            lineType: line_type_history[i],
                            index: i
                        });
                    }

                    // 删除直线
                    arrays_of_points.splice(i, 1);
                    perfect_cache.splice(i, 1);
                    line_type_history.splice(i, 1);

                    strokeRemoved = true;
                    break;
                }
            }
        }
    }

    // 如果有笔迹被移除，重绘画布
    if (strokeRemoved) {
        // 添加擦除操作到历史记录
        line_type_history.push('E'); // 'E' 表示 Eraser操作
        ts_undo_button.className = "active"; // 激活撤销按钮

        // 设置操作类型为擦除
        strokeOperation = 'E';

        // 检查是否所有笔迹都被擦除
        if (arrays_of_points.length === 0 && (typeof strokes === 'undefined' || strokes.length === 0)) {
            // 重置nextLine和nextPoint，确保下一次绘制正确开始
            nextLine = 0;
            nextPoint = 0;
            if (typeof nextStroke !== 'undefined') {
                nextStroke = 0;
            }
        }

        // 重绘画布
        ts_redraw();

        // 标记笔迹已变化，触发保存
        strokesChanged = true;
        save_strokes_debounced();

        // 添加调试日志
        console.log('AnkiDraw Debug: 笔迹擦除完成，触发保存');
    }
}

// 获取适当的擦除容差，考虑擦除模式类型
function getEraserTolerance(strokeType) {
    // 获取橡皮擦大小，如果未定义则使用默认值
    var eraserSize = typeof eraserIndicatorSize !== 'undefined' ? eraserIndicatorSize : 4;

    // 计算基础容差 - 橡皮擦越大，容差越大
    var baseTolerance = Math.max(eraserSize / 2, 1);

    // 根据笔画类型进行调整
    if (strokeType === 'line') {
        return baseTolerance;
    }
    else if (strokeType === 'calligraphy') {
        // 书法笔迹需要更精确的控制
        return baseTolerance * 0.75;
    }
    // 普通笔迹
    else {
        return baseTolerance;
    }
}

// 检查点是否在笔画附近，考虑擦除模式
function isPointNearStroke(point, strokePoints) {
    // 根据笔迹类型获取适当的容差
    var tolerance = getEraserTolerance((strokePoints.length === 2) ? 'line' : 'normal');

    // 如果是直线（只有两个点）
    if (strokePoints.length === 2) {
        var p1 = strokePoints[0];
        var p2 = strokePoints[1];

        return distanceToSegment(
            { x: point[0], y: point[1] },
            { x: p1[0], y: p1[1] },
            { x: p2[0], y: p2[1] }
        ) <= tolerance;
    }

    // 检查点到每个线段的距离
    for (var i = 0; i < strokePoints.length - 1; i++) {
        var p1 = strokePoints[i];
        var p2 = strokePoints[i + 1];

        if (distanceToSegment(
            { x: point[0], y: point[1] },
            { x: p1[0], y: p1[1] },
            { x: p2[0], y: p2[1] }
        ) <= tolerance) {
            return true;
        }
    }

    return false;
}

// 检查点是否在书法笔画附近，考虑擦除模式
function isPointNearCalligraphyStrokeWithTolerance(point, stroke) {
    // 获取书法笔迹的容差
    var tolerance = getEraserTolerance('calligraphy');

    // 遍历每个段的控制点
    for (var i = 0; i < stroke.segments.length; i++) {
        var segment = stroke.segments[i];
        var controlPoints = segment.controlPoints;

        // 检查每个控制点对
        for (var j = 0; j < controlPoints.length - 1; j++) {
            var p1 = controlPoints[j];
            var p2 = controlPoints[j + 1];

            if (distanceToSegment(
                { x: point[0], y: point[1] },
                p1,
                p2
            ) <= tolerance) {
                return true;
            }
        }
    }

    return false;
}

// 设置矩形颜色
function set_rectangle_color(newColor) {
    rectangleColor = newColor;
}

// 设置矩形线宽
function set_rectangle_width(newWidth) {
    rectangleWidth = newWidth;
}

// 专门更新矩形工具的设置
function update_rectangle_settings() {
    secondary_ctx.lineJoin = 'round';
    secondary_ctx.lineCap = 'round';
    secondary_ctx.lineWidth = rectangleWidth; // 使用矩形专用的线宽
    secondary_ctx.strokeStyle = rectangleColor; // 使用矩形专用的颜色
    secondary_ctx.fillStyle = rectangleColor;
    secondary_ctx.setLineDash([]); // 矩形总是使用实线
}

// 切换矩形模式
function switch_rectangle_mode() {
    stop_drawing();
    rectangleMode = !rectangleMode;

    var rectangleButton = document.getElementById('ts_rectangle_button');
    var ts_write_button = document.getElementById('ts_write_button');

    if (rectangleMode) {
        rectangleButton.className = 'active';

        // 确保矩形工具的属性在第一次使用时有合理的默认值
        if (rectangleColor === '#fff' && color !== '#fff') {
            rectangleColor = color; // 如果矩形颜色未设置，则继承当前画笔颜色
        }
        if (rectangleWidth === 2 && line_width !== 2) {
            rectangleWidth = line_width; // 如果矩形线宽未设置，则继承当前画笔线宽
        }

        // 禁用其他模式
        ts_perfect_freehand_button.className = '';
        ts_write_button.className = '';
        perfectFreehand = false;
        ts_kanji_button.className = '';
        calligraphy = false;

        // 停用直线模式
        lineMode = false;
        document.getElementById('ts_line_button').className = '';

        if (eraserMode) {
            toggleEraser(false);
        }

        // 如果笔端擦除模式活跃，禁用它
        isPenEraserActive = false;

        // 为矩形模式设置正确的事件监听器
        if (typeof pointerDownRectangle === 'function') {
            // 确保事件监听器只添加一次
            canvas.removeEventListener('pointerdown', pointerDownRectangle);
            canvas.removeEventListener('pointermove', pointerMoveRectangle);
            window.removeEventListener('pointerup', pointerUpRectangle);

            canvas.addEventListener('pointerdown', pointerDownRectangle);
            canvas.addEventListener('pointermove', pointerMoveRectangle);
            window.addEventListener('pointerup', pointerUpRectangle);
        }
    } else {
        rectangleButton.className = '';
        ts_write_button.className = 'active';

        // 移除矩形工具的事件监听器
        if (typeof pointerDownRectangle === 'function') {
            canvas.removeEventListener('pointerdown', pointerDownRectangle);
            canvas.removeEventListener('pointermove', pointerMoveRectangle);
            window.removeEventListener('pointerup', pointerUpRectangle);
        }
    }
}

// 在pointerUpLine函数定义后添加以下函数
function pointerDownRectangle(e) {
    // 如果是触摸事件，直接返回，不处理绘图
    if (e.pointerType === 'touch') {
        return;
    }

    if (!rectangleMode || !visible) return;

    // 检查是否是橡皮擦模式或侧键擦除模式，或者笔端擦除模式，如果是则不绘制矩形
    if (eraserMode || isSidePenButtonEraser || isPenEraserActive ||
        (e.pointerType === 'pen' && (e.button === 1 || e.button === 2 || e.button === 5))) {
        return;
    }

    // 只对笔和鼠标事件阻止默认行为
    if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        e.preventDefault();
    }

    isDrawingRect = true;

    // 记录起始点
    rectStartX = e.offsetX;
    rectStartY = e.offsetY;

    // 清除可能的临时绘制
    secondary_ctx.clearRect(0, 0, secondary_canvas.width, secondary_canvas.height);
}

function pointerMoveRectangle(e) {
    // 如果是触摸事件，直接返回，不处理绘图
    if (e.pointerType === 'touch') {
        return;
    }

    if (!isDrawingRect || !rectangleMode || !visible) return;

    // 检查是否是橡皮擦模式或侧键擦除模式，如果是则不绘制矩形
    if (eraserMode || isSidePenButtonEraser) {
        return;
    }

    // 只对笔和鼠标事件阻止默认行为
    if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        e.preventDefault();
    }

    // 清除临时绘制
    secondary_ctx.clearRect(0, 0, secondary_canvas.width, secondary_canvas.height);

    // 绘制矩形预览
    secondary_ctx.beginPath();
    secondary_ctx.strokeStyle = rectangleColor;
    secondary_ctx.lineWidth = rectangleWidth;
    secondary_ctx.rect(
        rectStartX,
        rectStartY,
        e.offsetX - rectStartX,
        e.offsetY - rectStartY
    );
    secondary_ctx.stroke();
}

function pointerUpRectangle(e) {
    // 如果是触摸事件，直接返回，不处理绘图
    if (e.pointerType === 'touch') {
        return;
    }

    if (!isDrawingRect || !rectangleMode) return;

    // 检查是否是橡皮擦模式或侧键擦除模式，如果是则不绘制矩形
    if (eraserMode || isSidePenButtonEraser) {
        isDrawingRect = false;
        return;
    }

    // 只对笔和鼠标事件阻止默认行为
    if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        e.preventDefault();
    }

    isDrawingRect = false;

    // 清除临时绘制
    secondary_ctx.clearRect(0, 0, secondary_canvas.width, secondary_canvas.height);

    // 添加矩形到主画布
    var startPoint = [rectStartX, rectStartY, rectangleColor, rectangleWidth, { style: 'rectangle', dashPattern: [] }];
    var endPoint = [e.offsetX, e.offsetY];

    // 添加到点集合中
    arrays_of_points.push([startPoint, endPoint]);

    // 添加到线型历史记录中
    line_type_history.push("R"); // 使用R表示矩形类型

    // 创建Perfect Freehand的缓存项
    perfect_cache.push(null);

    // 重绘画布
    ts_redraw();

    // 激活撤销按钮
    ts_undo_button.className = "active";

    // 设置操作类型为添加
    strokeOperation = 'A';

    // 标记笔迹已变化，触发保存
    strokesChanged = true;
    save_strokes_debounced();

    // 添加调试日志
    console.log('AnkiDraw Debug: 矩形绘制完成，触发保存');
}

// 添加矩形工具设置更新函数
function update_rectangle_settings() {
    // 设置矩形绘制的样式
    secondary_ctx.strokeStyle = rectangleColor;
    secondary_ctx.lineWidth = rectangleWidth;
    secondary_ctx.setLineDash([]); // 矩形使用实线
}

// 初始化事件监听器时添加矩形处理函数
// 在原有初始化代码后添加以下内容:
canvas.addEventListener("pointerdown", pointerDownRectangle);
canvas.addEventListener("pointermove", pointerMoveRectangle);
window.addEventListener("pointerup", pointerUpRectangle);

// 添加函数，用于在页面加载时初始化矩形工具设置
function initializeRectangleSettings(color, width) {
    // 保存矩形工具的颜色和宽度到全局变量
    rectangleColor = color;
    rectangleWidth = width;

    // 更新矩形工具设置
    update_rectangle_settings();
}

// 添加函数，用于应用保存的矩形工具设置
function applyRectangleSettings() {
    // 更新矩形工具设置
    update_rectangle_settings();
}

// 添加侧键橡皮擦功能处理
function setupSidePenButtonEraser() {
    // 监听全局按下事件，检测Surface Pen侧键按下
    document.addEventListener('pointerdown', handleSidePenButtonDown);
}

// 处理Surface Pen侧键按下事件
function handleSidePenButtonDown(e) {
    // 检查是否是Surface Pen并且使用侧键(button为1或2)
    if (e.pointerType === 'pen' && (e.button === 1 || e.button === 2)) {
        e.preventDefault();
        e.stopPropagation();

        if (!isSidePenButtonEraser) {
            // 如果当前没有激活侧键橡皮擦，保存当前工具状态并激活橡皮擦
            saveCurrentToolState();
            activateSidePenButtonEraser();

            // 添加body类
            document.body.classList.add('side-button-active');

            // 如果是在绘制矩形中，取消矩形绘制
            if (isDrawingRect) {
                isDrawingRect = false;
                secondary_ctx.clearRect(0, 0, secondary_canvas.width, secondary_canvas.height);
            }
        } else {
            // 如果已经激活了侧键橡皮擦，恢复之前的工具状态
            deactivateSidePenButtonEraser();

            // 移除body类
            document.body.classList.remove('side-button-active');
        }
    }
}

// 保存当前工具状态
function saveCurrentToolState() {
    previousToolState = {
        perfectFreehand: perfectFreehand,
        calligraphy: calligraphy,
        lineMode: lineMode,
        rectangleMode: rectangleMode,
        eraserMode: typeof eraserMode !== 'undefined' ? eraserMode : false
    };
}

// 激活侧键橡皮擦模式
function activateSidePenButtonEraser() {
    isSidePenButtonEraser = true;

    // 如果当前不是橡皮擦模式，切换到橡皮擦模式
    if (typeof toggleEraser === 'function' && !eraserMode) {
        toggleEraser(true, true); // 第二个参数表示这是侧键模式
    }

    // 更新UI状态
    if (typeof eraserMode !== 'undefined' && eraserMode) {
        var eraserButton = document.getElementById('ts_eraser_button');
        if (eraserButton) {
            eraserButton.classList.add('active');
            eraserButton.classList.add('side-button-active');
        }
    }
}

// 取消激活侧键橡皮擦模式
function deactivateSidePenButtonEraser() {
    isSidePenButtonEraser = false;

    // 移除body类
    document.body.classList.remove('side-button-active');

    // 如果当前是橡皮擦模式且是侧键激活的，关闭橡皮擦并恢复之前的工具
    if (typeof eraserMode !== 'undefined' && eraserMode) {
        toggleEraser(false, true); // 关闭橡皮擦

        // 移除侧键激活标记
        var eraserButton = document.getElementById('ts_eraser_button');
        if (eraserButton) {
            eraserButton.classList.remove('side-button-active');
        }

        // 清除提示信息
        var hint = document.getElementById('side-button-mode-hint');
        if (hint) {
            hint.parentNode.removeChild(hint);
        }

        // 恢复之前的工具状态
        restorePreviousToolState();
    }
}

// 恢复之前的工具状态
function restorePreviousToolState() {
    // 恢复之前的完美手绘状态
    if (previousToolState.perfectFreehand && !perfectFreehand) {
        switch_perfect_freehand();
    } else if (!previousToolState.perfectFreehand && perfectFreehand) {
        switch_perfect_freehand();
    }

    // 恢复之前的书法模式状态
    if (previousToolState.calligraphy && !calligraphy) {
        switch_kanji_mode();
    } else if (!previousToolState.calligraphy && calligraphy) {
        switch_kanji_mode();
    }

    // 恢复之前的直线模式状态
    if (previousToolState.lineMode && !lineMode) {
        switch_line_mode();
    } else if (!previousToolState.lineMode && lineMode) {
        switch_line_mode();
    }

    // 恢复之前的矩形模式状态
    if (previousToolState.rectangleMode && !rectangleMode) {
        switch_rectangle_mode();
    } else if (!previousToolState.rectangleMode && rectangleMode) {
        switch_rectangle_mode();
    }
}

function blackboard_init() {
    // 初始化各种工具和事件监听器

    // 设置各工具的初始状态
    update_pen_settings();
    if (typeof update_line_settings === 'function') {
        update_line_settings();
    }
    if (typeof update_rectangle_settings === 'function') {
        update_rectangle_settings();
    }

    // 设置直线样式选择器
    if (typeof setupLineStyleEvents === 'function') {
        setupLineStyleEvents();
    }

    // 初始化Surface Pen侧键橡皮擦功能
    setupSidePenButtonEraser();

    // 设置Surface Pen笔端擦除事件监听器
    canvas.addEventListener('pointerdown', handlePenEraser);
    canvas.addEventListener('pointermove', handlePenEraserMove);
    window.addEventListener('pointerup', stopPenEraser);

    // 如果有eraser模块，设置橡皮擦事件监听器
    if (typeof setupEraserEvents === 'function') {
        setupEraserEvents();
    }

    // 添加对触摸事件的特殊处理，确保允许默认滚动行为
    canvas.addEventListener('touchstart', function (e) {
        // 允许默认的触摸滚动行为
    }, { passive: true });

    canvas.addEventListener('touchmove', function (e) {
        // 允许默认的触摸滚动行为
    }, { passive: true });

    canvas.addEventListener('touchend', function (e) {
        // 允许默认的触摸滚动行为
    }, { passive: true });

    console.log("AnkiDraw: Blackboard initialized with Surface Pen eraser support and touch scrolling");
}

// 调用blackboard初始化函数
document.addEventListener('DOMContentLoaded', function () {
    // 确保DOM完全加载后再初始化
    setTimeout(function () {
        blackboard_init();
    }, 500);
});

// 添加笔迹保存和加载的相关函数

/**
 * 将当前笔迹数据转换为JSON字符串，用于保存
 */
function serialize_strokes() {
    try {
        console.log('AnkiDraw Debug: 开始序列化笔迹数据，操作类型:', strokeOperation);
        // 创建一个包含所有笔迹数据的对象
        var strokeData = {
            arrays_of_points: arrays_of_points,
            line_type_history: line_type_history,
            perfect_cache: perfect_cache,
            strokes: typeof strokes !== 'undefined' ? strokes : [],  // 添加书法笔画数据
            lastModified: new Date().getTime()
        };

        // 只有在添加笔迹操作时才更新窗口大小
        if (strokeOperation === 'A') {
            // 记录当前窗口大小 - 使用多种方法获取高度
            var currentWindowWidth = window.innerWidth;
            var currentWindowHeight = window.innerHeight;

            // 获取设备像素比
            var dpr = window.devicePixelRatio || 1;
            console.log('AnkiDraw Debug: 当前设备像素比(DPR):', dpr);

            // 获取其他可能的高度测量值
            var card = document.getElementsByClassName('card')[0];
            var docHeight = Math.max(
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight,
                document.documentElement.clientHeight
            );
            var bodyHeight = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.body.clientHeight
            );
            var cardHeight = card ? Math.max(card.scrollHeight, card.offsetHeight, card.clientHeight) : 0;

            // 选择最大的合理高度作为基准
            var baseHeight = Math.max(currentWindowHeight, docHeight, bodyHeight, cardHeight);
            console.log('AnkiDraw Debug: 高度测量值:', {
                windowHeight: currentWindowHeight,
                docHeight: docHeight,
                bodyHeight: bodyHeight,
                cardHeight: cardHeight,
                baseHeight: baseHeight
            });

            // 对Windows系统，使用更精确的补偿逻辑
            var isWindows = navigator.userAgent.indexOf('Windows') !== -1;
            var adjustedHeight = baseHeight;
            if (isWindows) {
                // 动态调整补偿系数
                var compensationFactor = 1.05;  // 基础补偿5%
                if (dpr > 1.5) {  // 高DPI显示器
                    compensationFactor = 1.08;  // 增加8%
                } else if (dpr > 1.0) {
                    compensationFactor = 1.06;  // 增加6%
                }
                adjustedHeight = Math.ceil(baseHeight * compensationFactor);
                console.log('AnkiDraw Debug: Windows系统补偿调整:', {
                    factor: compensationFactor,
                    original: baseHeight,
                    adjusted: adjustedHeight
                });
            }

            // 更新窗口大小信息 - 保存所有测量值供后续分析
            strokeData.window_size = {
                width: currentWindowWidth,
                height: adjustedHeight,
                dpr: dpr,
                originalHeight: currentWindowHeight,
                docHeight: docHeight,
                bodyHeight: bodyHeight,
                cardHeight: cardHeight,
                baseHeight: baseHeight,
                isWindows: isWindows
            };

            // 更新最后保存的窗口大小
            lastWindowSize.width = currentWindowWidth;
            lastWindowSize.height = adjustedHeight;

            console.log('AnkiDraw Debug: 笔迹数据对象创建成功',
                'points数组长度:', arrays_of_points.length,
                'line_type_history长度:', line_type_history.length,
                '原始窗口大小: 宽=' + currentWindowWidth + ', 高=' + currentWindowHeight,
                '调整后窗口大小: 宽=' + currentWindowWidth + ', 高=' + adjustedHeight);
        }
        // 对于撤销和擦除操作，使用最后保存的窗口大小
        else if (lastWindowSize.width > 0 && lastWindowSize.height > 0) {
            strokeData.window_size = {
                width: lastWindowSize.width,
                height: lastWindowSize.height,
                dpr: window.devicePixelRatio || 1,
                originalHeight: lastWindowSize.height // 对于撤销和擦除操作，originalHeight就是调整后的高度
            };

            console.log('AnkiDraw Debug: 使用最后保存的窗口大小',
                'width:', lastWindowSize.width,
                'height:', lastWindowSize.height);
        }

        console.log('AnkiDraw Debug: 笔迹数据对象创建成功',
            'points数组长度:', arrays_of_points.length,
            'line_type_history长度:', line_type_history.length,
            '操作类型:', strokeOperation);

        // 将对象转换为JSON字符串
        var jsonStr = JSON.stringify(strokeData);
        console.log('AnkiDraw Debug: 序列化完成，JSON长度:', jsonStr.length);
        return jsonStr;
    } catch (e) {
        console.error('AnkiDraw Error: 序列化笔迹数据时出错', e);
        return JSON.stringify({
            arrays_of_points: [],
            line_type_history: [],
            perfect_cache: [],
            strokes: [],
            lastModified: new Date().getTime()
        });
    }
}

/**
 * 保存当前笔迹数据到服务器
 */
function save_strokes() {
    // 防止重复操作
    if (isProcessingStrokeData) {
        console.log('AnkiDraw Debug: 笔迹数据正在处理中，跳过保存');
        return;
    }

    try {
        console.log('AnkiDraw Debug: 开始保存笔迹数据，是否仅正面笔迹:', isQuestionSide);
        isProcessingStrokeData = true;

        // 确保有卡片ID
        if (!currentCardId) {
            console.error('AnkiDraw Error: 保存笔迹失败，没有卡片ID');
            isProcessingStrokeData = false;
            return;
        }

        console.log('AnkiDraw Debug: 准备保存卡片ID:', currentCardId);
        // 序列化笔迹数据
        var strokeData = serialize_strokes();

        // 通过pycmd发送到Python端保存
        if (typeof pycmd === 'function') {
            console.log('AnkiDraw Debug: 发送笔迹数据到Python端，数据长度:', strokeData.length);

            // 获取窗口大小信息 - 只有在添加笔迹操作时才发送
            if (strokeOperation === 'A') {
                var windowWidth = window.innerWidth;
                var windowHeight = window.innerHeight;
                pycmd('ankidraw:save_strokes:' + currentCardId + ':' + strokeData + ':' + windowWidth + ':' + windowHeight);
                console.log('AnkiDraw Debug: 笔迹数据已发送，卡片ID:', currentCardId, '窗口大小:', windowWidth, 'x', windowHeight);
            } else {
                // 撤销或擦除操作，不发送窗口大小
                pycmd('ankidraw:save_strokes_no_window:' + currentCardId + ':' + strokeData);
                console.log('AnkiDraw Debug: 笔迹数据已发送，卡片ID:', currentCardId, '(不更新窗口大小)');
            }
        } else {
            console.error('AnkiDraw Error: pycmd函数不可用，无法保存笔迹');
        }

        // 重置变化标记
        strokesChanged = false;
    } catch (e) {
        console.error('AnkiDraw Error: 保存笔迹时出错', e);
    } finally {
        isProcessingStrokeData = false;
    }
}

/**
 * 防抖函数，延迟保存笔迹数据，避免频繁保存
 */
function save_strokes_debounced() {
    // 如果没有卡片ID，不执行保存
    if (!currentCardId) return;

    // 清除之前的计时器
    if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer);
    }

    // 设置新的计时器，延迟1秒后保存
    saveDebounceTimer = setTimeout(function () {
        // 只有在笔迹发生变化时才保存
        if (strokesChanged) {
            save_strokes();
        }
    }, 1000);
}

/**
 * 从保存的数据中加载笔迹
 * @param {string} strokesJson - 包含笔迹数据的JSON字符串
 * @param {boolean} isQuestionOnly - 是否仅加载问题侧的笔迹
 */
function load_saved_strokes(strokesJson, isQuestionOnly) {
    // 防止重复操作
    if (isProcessingStrokeData) {
        console.log('AnkiDraw Debug: 笔迹数据正在处理中，跳过加载');
        return;
    }

    try {
        console.log('AnkiDraw Debug: 开始加载笔迹数据，数据长度:', strokesJson.length, '是否仅正面笔迹:', isQuestionOnly);
        isProcessingStrokeData = true;

        // 更新全局变量
        isQuestionSide = isQuestionOnly !== false;

        // 解析JSON数据
        console.log('AnkiDraw Debug: 解析JSON数据');
        let strokeData;
        try {
            strokeData = JSON.parse(strokesJson);
            console.log('AnkiDraw Debug: 直接解析JSON成功');
        } catch (parseError) {
            // 第一次解析失败，尝试处理转义字符
            console.log('AnkiDraw Debug: 直接解析失败，尝试处理转义字符', parseError);
            try {
                // 两层解析：首先把字符串恢复成正确的JSON字符串，然后再解析
                let jsonString = JSON.parse('"' + strokesJson + '"');
                strokeData = JSON.parse(jsonString);
                console.log('AnkiDraw Debug: 两步解析JSON成功');
            } catch (deepError) {
                // 两层解析也失败，尝试直接使用传入的数据
                console.error('AnkiDraw Error: 两步解析也失败', deepError);
                throw deepError;
            }
        }

        // 非问题侧且当前存在已加载的笔迹，并且正在显示答案，需要考虑合并正面笔迹
        if (!isQuestionOnly && arrays_of_points.length > 0 && !isQuestionSide) {
            console.log('AnkiDraw Debug: 显示答案时，尝试保留当前笔迹(可能包含正面笔迹)');

            // 如果新加载的数据(背面笔迹)和当前已有的数据(正面笔迹)是不同的，进行合并
            // 比较第一个笔画是否不同来判断是否需要合并
            let needMerge = false;
            if (strokeData.arrays_of_points.length === 0 && arrays_of_points.length > 0) {
                needMerge = true; // 新数据为空，但当前有数据，需要合并
            } else if (strokeData.arrays_of_points.length > 0 && arrays_of_points.length > 0) {
                // 比较第一个点的坐标是否相同
                if (JSON.stringify(strokeData.arrays_of_points[0]) !== JSON.stringify(arrays_of_points[0])) {
                    needMerge = true;
                }
            }

            if (needMerge) {
                console.log('AnkiDraw Debug: 当前显示答案，保留正面笔迹并合并新加载的背面笔迹');

                // 保存当前正面笔迹数据
                let currentArraysOfPoints = arrays_of_points;
                let currentLineTypeHistory = line_type_history;
                let currentPerfectCache = perfect_cache || [];
                let currentStrokes = strokes || [];

                // 清除当前画布，准备合并
                console.log('AnkiDraw Debug: 清除当前画布，准备合并笔迹');
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                // 合并正面笔迹与新加载的背面笔迹
                strokeData.arrays_of_points = currentArraysOfPoints.concat(strokeData.arrays_of_points);
                strokeData.line_type_history = currentLineTypeHistory.concat(strokeData.line_type_history);

                // 处理书法笔画数据
                if (strokeData.strokes && currentStrokes.length > 0) {
                    strokeData.strokes = currentStrokes.concat(strokeData.strokes);
                } else if (currentStrokes.length > 0) {
                    strokeData.strokes = currentStrokes;
                }

                // 处理完美手写缓存
                if (strokeData.perfect_cache && currentPerfectCache.length > 0) {
                    strokeData.perfect_cache = currentPerfectCache.concat(strokeData.perfect_cache);
                } else if (currentPerfectCache.length > 0) {
                    strokeData.perfect_cache = currentPerfectCache;
                }

                console.log('AnkiDraw Debug: 完成笔迹合并，合并后points数组长度:', strokeData.arrays_of_points.length);

                // 重置变化标记，触发保存
                strokesChanged = true;
                save_strokes_debounced();
            }
        }

        // 清除当前画布
        console.log('AnkiDraw Debug: 清除当前画布');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // 加载笔迹数据
        console.log('AnkiDraw Debug: 加载笔迹数据到内存');
        arrays_of_points = strokeData.arrays_of_points || [];
        line_type_history = strokeData.line_type_history || [];
        perfect_cache = strokeData.perfect_cache || [];

        console.log('AnkiDraw Debug: 加载完成，points数组长度:', arrays_of_points.length,
            'line_type_history长度:', line_type_history.length);

        // 如果数据中有strokes数组（用于书法功能），也加载它
        if (strokeData.strokes) {
            console.log('AnkiDraw Debug: 加载书法笔画数据');
            strokes = strokeData.strokes;
        } else {
            strokes = [];
        }

        // 确保重绘前调整画布大小
        console.log('AnkiDraw Debug: 调整画布大小');
        resize();

        // 重绘所有笔迹
        console.log('AnkiDraw Debug: 重绘所有笔迹');
        ts_redraw();

        console.log('AnkiDraw Debug: 成功加载笔迹数据，卡片ID:', currentCardId, '是否仅正面笔迹:', isQuestionSide);

        // 从加载的数据中提取窗口大小并保存到lastWindowSize
        if (strokeData.window_size) {
            lastWindowSize.width = strokeData.window_size.width;
            lastWindowSize.height = strokeData.window_size.height;
            console.log('AnkiDraw Debug: 加载笔迹时更新最后保存的窗口大小:',
                'width:', lastWindowSize.width,
                'height:', lastWindowSize.height);
        }

        // 加载后重置变化标记和操作类型，防止立即触发保存
        strokesChanged = false;
        strokeOperation = '';
    } catch (e) {
        console.error('AnkiDraw Error: 加载笔迹数据时出错', e, '原始数据:', strokesJson.substring(0, 100) + '...');
        // 出错时清空画布，避免显示错误的笔迹
        clear_canvas();
    } finally {
        isProcessingStrokeData = false;
    }
}

// 获取当前卡片ID并加载笔迹数据的功能
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        console.log('AnkiDraw Debug: DOM加载完成，开始获取卡片ID');

        if (typeof pycmd !== 'function') {
            console.error('AnkiDraw Error: pycmd函数不可用，无法获取卡片ID');
            return;
        }

        // 获取卡片ID
        var cardId = '';

        try {
            // 尝试从全局变量中获取卡片ID (桌面版Anki)
            if (typeof globalThis !== 'undefined' && typeof globalThis.ankiPlatform !== 'undefined') {
                console.log('AnkiDraw Debug: 正在使用Anki桌面版方法获取卡片ID');
            }

            // 尝试最常见的方法
            if (typeof globalThis !== 'undefined' && typeof globalThis.cardid !== 'undefined') {
                cardId = globalThis.cardid;
                console.log('AnkiDraw Debug: 从globalThis.cardid获取到卡片ID:', cardId);
            }
            // 尝试AnkiDroid方法
            else if (typeof AnkiDroidJS !== 'undefined' && typeof AnkiDroidJS.ankiGetCardId === 'function') {
                cardId = AnkiDroidJS.ankiGetCardId();
                console.log('AnkiDraw Debug: 从AnkiDroidJS获取到卡片ID:', cardId);
            }
            // 后备方法: 从页面元素获取
            else {
                console.log('AnkiDraw Debug: 尝试从页面元素中查找卡片ID');
                // 有些版本的Anki在特定元素中存储了cardid
                var metaElements = document.querySelectorAll('meta[name="cardid"]');
                if (metaElements.length > 0) {
                    cardId = metaElements[0].getAttribute('content');
                    console.log('AnkiDraw Debug: 从meta标签获取到卡片ID:', cardId);
                }
            }
        } catch (e) {
            console.error('AnkiDraw Error: 获取卡片ID失败', e);
        }

        if (cardId) {
            window.currentCardId = cardId;
            console.log('AnkiDraw Debug: 成功设置当前卡片ID:', cardId);

            // 请求加载此卡片的笔迹数据 - 根据当前是问题还是答案加载不同笔迹
            try {
                // 检测当前是否显示答案
                var isShowingAnswer = false;
                if (document.getElementById('answer')) {
                    var answerElement = document.getElementById('answer');
                    isShowingAnswer = answerElement && window.getComputedStyle(answerElement).display !== 'none';
                }

                if (isShowingAnswer) {
                    console.log('AnkiDraw Debug: 检测到答案区域，加载全部笔迹');
                    pycmd('ankidraw:load_all_strokes:' + cardId);
                } else {
                    console.log('AnkiDraw Debug: 未检测到答案区域，加载正面笔迹');
                    pycmd('ankidraw:load_front_strokes:' + cardId);
                }
            } catch (e) {
                console.error('AnkiDraw Error: 检测卡片区域失败，默认加载正面笔迹', e);
                // 出错时默认加载正面笔迹
                pycmd('ankidraw:load_front_strokes:' + cardId);
            }
        } else {
            // 如果无法获取卡片ID，尝试从Python获取
            console.log('AnkiDraw Debug: 通过Python获取卡片ID');
            pycmd('ankidraw:get_card_id');
        }
    }, 500); // 延迟执行，确保DOM已完全加载
});

/**
 * 恢复到书写时的窗口大小
 */
function restore_window_size() {
    try {
        // 确保有卡片ID
        if (!currentCardId) {
            console.error('AnkiDraw Error: 恢复窗口大小失败，没有卡片ID');
            return;
        }

        // 检查是否在问题侧，如果是则直接返回
        if (isQuestionSide) {
            return;
        }

        // 获取当前DPI和操作系统信息
        var dpr = window.devicePixelRatio || 1;
        var isWindows = navigator.userAgent.indexOf('Windows') !== -1;

        // 获取当前窗口大小信息
        var currentWidth = window.innerWidth;
        var currentHeight = window.innerHeight;

        // 计算当前卡片内容高度
        var card = document.getElementsByClassName('card')[0];
        var cardHeight = card ? Math.max(card.scrollHeight, card.offsetHeight, card.clientHeight) : 0;
        var docHeight = Math.max(
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight,
            document.documentElement.clientHeight
        );

        // 附加当前系统和窗口信息
        var systemInfo = `:${dpr}:${isWindows ? 'win' : 'other'}:${currentWidth}:${currentHeight}:${docHeight}:${cardHeight}`;

        console.log('AnkiDraw Debug: 恢复窗口大小，当前窗口信息:', {
            width: currentWidth,
            height: currentHeight,
            dpr: dpr,
            isWindows: isWindows,
            docHeight: docHeight,
            cardHeight: cardHeight
        });

        // 通过pycmd发送命令到Python端
        if (typeof pycmd === 'function') {
            // 只处理答案侧的情况
            pycmd('ankidraw:restore_all_window_size:' + currentCardId + systemInfo);
        } else {
            console.error('AnkiDraw Error: pycmd函数不可用，无法恢复窗口大小');
        }
    } catch (e) {
        console.error('AnkiDraw Error: 恢复窗口大小时出错', e);
    }
}

/**
 * 更新恢复窗口大小按钮的可见性
 */
function updateRestoreWindowSizeButtonVisibility() {
    var button = document.getElementById('ts_restore_window_size_button');
    if (button) {
        button.style.display = isQuestionSide ? 'none' : 'block';
    }
}

// 添加自定义事件监听器
document.addEventListener('ankidraw:showQuestion', function () {
    isQuestionSide = true;
    updateRestoreWindowSizeButtonVisibility();
});

document.addEventListener('ankidraw:showAnswer', function () {
    isQuestionSide = false;
    updateRestoreWindowSizeButtonVisibility();
});

// 在页面加载时初始化按钮状态
document.addEventListener('DOMContentLoaded', function () {
    // 在现有DOMContentLoaded事件处理函数中添加
    setTimeout(function () {
        updateRestoreWindowSizeButtonVisibility();
    }, 600); // 延迟执行，确保在其他初始化之后
});
