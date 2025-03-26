/**
 * Eraser functionality for AnkiDraw
 * Allows clicking or dragging to remove entire strokes at once
 */

// Eraser state variables
var eraserMode = false;
var isEraserDragging = false;

// 橡皮擦尺寸调节滚动条变量
var eraserSizeSlider = null;
var eraserSizeSliderTimeout = null;
var minEraserSize = 1;
var maxEraserSize = 20;
var defaultEraserSize = 4;

// 橡皮擦指示器变量
var eraserIndicator = null;
var eraserIndicatorSize = defaultEraserSize;  // 初始化为默认值

// 框选擦除变量
var rectangleEraseMode = false;
var rectangleStartPoint = null;
var rectangleCurrentPoint = null;
var rectangleSelectBox = null;

/**
 * 创建橡皮擦指示器
 */
function createEraserIndicator() {
    if (!eraserIndicator) {
        eraserIndicator = document.createElement('div');
        eraserIndicator.id = 'eraser-indicator';
        eraserIndicator.style.position = 'fixed';
        eraserIndicator.style.pointerEvents = 'none';
        eraserIndicator.style.zIndex = '9999';
        eraserIndicator.style.border = '1px solid #2196F3';
        eraserIndicator.style.borderRadius = '50%';
        eraserIndicator.style.display = 'none';
        eraserIndicator.style.boxSizing = 'border-box';
        eraserIndicator.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
        document.body.appendChild(eraserIndicator);
    }
}

/**
 * 创建框选擦除选择框
 */
function createRectangleSelectBox() {
    if (!rectangleSelectBox) {
        rectangleSelectBox = document.createElement('div');
        rectangleSelectBox.id = 'rectangle-select-box';
        rectangleSelectBox.style.position = 'fixed';
        rectangleSelectBox.style.pointerEvents = 'none';
        rectangleSelectBox.style.zIndex = '9999';
        rectangleSelectBox.style.border = '1px dashed #2196F3';
        rectangleSelectBox.style.display = 'none';
        rectangleSelectBox.style.boxSizing = 'border-box';
        rectangleSelectBox.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
        document.body.appendChild(rectangleSelectBox);
    }
}

/**
 * 创建橡皮擦大小调节滚动条
 */
function createEraserSizeSlider() {
    if (!eraserSizeSlider) {
        // 创建容器
        var sliderContainer = document.createElement('div');
        sliderContainer.id = 'eraser-size-slider-container';
        sliderContainer.style.position = 'fixed';
        sliderContainer.style.zIndex = '9998';
        sliderContainer.style.background = 'rgba(0, 0, 0, 0.5)'; // 半透明背景，与工具栏一致
        sliderContainer.style.padding = '10px';
        sliderContainer.style.borderRadius = '5px';
        sliderContainer.style.display = 'none';
        sliderContainer.style.transition = '0.3s'; // 添加过渡效果
        sliderContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)'; // 添加轻微阴影
        sliderContainer.style.opacity = '0.5'; // 初始透明度与工具栏一致

        // 添加标题
        var sliderTitle = document.createElement('div');
        sliderTitle.textContent = 'Eraser Size';
        sliderTitle.style.color = 'white';
        sliderTitle.style.fontSize = '12px';
        sliderTitle.style.marginBottom = '5px';
        sliderTitle.style.textAlign = 'center';
        sliderContainer.appendChild(sliderTitle);

        // 确保eraserIndicatorSize有一个有效值
        if (!eraserIndicatorSize || eraserIndicatorSize < minEraserSize || eraserIndicatorSize > maxEraserSize) {
            eraserIndicatorSize = defaultEraserSize;
        }

        // 创建滚动条
        var slider = document.createElement('input');
        slider.type = 'range';
        slider.min = minEraserSize;
        slider.max = maxEraserSize;
        slider.value = eraserIndicatorSize;
        slider.style.width = '100px';
        slider.style.display = 'block';
        slider.style.margin = '0 auto';

        // 添加值显示
        var sliderValue = document.createElement('div');
        sliderValue.textContent = slider.value + 'px';
        sliderValue.style.color = 'white';
        sliderValue.style.fontSize = '12px';
        sliderValue.style.marginTop = '5px';
        sliderValue.style.textAlign = 'center';

        // 添加事件监听
        slider.addEventListener('input', function () {
            updateEraserSize(this.value);
            sliderValue.textContent = this.value + 'px';
        });

        // 当用户停止拖动滑块时保存设置
        slider.addEventListener('change', function () {
            updateEraserSize(this.value, true);  // 第二个参数为true表示需要保存到配置
        });

        // 添加框选擦除模式选项
        var rectangleEraseOption = document.createElement('div');
        rectangleEraseOption.style.marginTop = '10px';
        rectangleEraseOption.style.color = 'white';
        rectangleEraseOption.style.fontSize = '12px';
        rectangleEraseOption.style.textAlign = 'center';

        // 创建复选框和标签
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'rectangle-erase-checkbox';
        checkbox.checked = rectangleEraseMode;
        checkbox.style.marginRight = '5px';

        // 复选框事件监听
        checkbox.addEventListener('change', function () {
            toggleRectangleEraseMode(this.checked);
        });

        var label = document.createElement('label');
        label.htmlFor = 'rectangle-erase-checkbox';
        label.textContent = 'Box Selection';

        rectangleEraseOption.appendChild(checkbox);
        rectangleEraseOption.appendChild(label);

        // 将框选选项添加到滑动块
        sliderContainer.appendChild(rectangleEraseOption);

        // 鼠标进入容器时清除自动隐藏计时器和增加不透明度
        sliderContainer.addEventListener('mouseenter', function () {
            clearTimeout(eraserSizeSliderTimeout);
            this.style.opacity = '1';
            this.style.transform = 'scale(1.05)'; // 添加与工具栏相同的悬停效果
        });

        // 鼠标离开容器时设置自动隐藏和恢复透明度
        sliderContainer.addEventListener('mouseleave', function () {
            this.style.opacity = '0.5';
            this.style.transform = 'scale(1)';
            startSliderHideTimer();
        });

        // 将元素添加到容器
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(sliderValue);

        // 将容器添加到文档
        document.body.appendChild(sliderContainer);
        eraserSizeSlider = sliderContainer;
    }

    return eraserSizeSlider;
}

/**
 * 显示橡皮擦大小调节滚动条
 */
function showEraserSizeSlider() {
    var sliderContainer = createEraserSizeSlider();

    // 清除可能存在的隐藏计时器
    clearTimeout(eraserSizeSliderTimeout);

    // 获取工具栏位置
    var toolbarElem = document.getElementById('pencil_button_bar');
    var eraserButton = document.getElementById('ts_eraser_button');

    if (toolbarElem && eraserButton) {
        var toolbarRect = toolbarElem.getBoundingClientRect();
        var buttonRect = eraserButton.getBoundingClientRect();

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
    }

    // 显示滚动条
    sliderContainer.style.display = 'block';

    // 设置3秒后自动隐藏
    startSliderHideTimer();
}

/**
 * 设置滚动条自动隐藏计时器
 */
function startSliderHideTimer() {
    clearTimeout(eraserSizeSliderTimeout);
    eraserSizeSliderTimeout = setTimeout(function () {
        if (eraserSizeSlider) {
            eraserSizeSlider.style.display = 'none';
        }
    }, 3000);
}

/**
 * 隐藏橡皮擦大小调节滚动条
 */
function hideEraserSizeSlider() {
    if (eraserSizeSlider) {
        eraserSizeSlider.style.display = 'none';
        clearTimeout(eraserSizeSliderTimeout);
    }
}

/**
 * 更新橡皮擦指示器的位置和大小
 */
function updateEraserIndicator(x, y) {
    if (!eraserIndicator) return;

    // 更新指示器位置
    eraserIndicator.style.left = (x - eraserIndicatorSize / 2) + 'px';
    eraserIndicator.style.top = (y - eraserIndicatorSize / 2) + 'px';
}

/**
 * 更新橡皮擦大小
 * @param {number} size - 新的橡皮擦大小
 * @param {boolean} [saveToProfile=false] - 是否需要将数据持久化保存到用户配置
 */
function updateEraserSize(size, saveToProfile) {
    // 更新橡皮擦大小
    eraserIndicatorSize = parseInt(size);

    // 更新指示器大小
    if (eraserIndicator) {
        eraserIndicator.style.width = eraserIndicatorSize + 'px';
        eraserIndicator.style.height = eraserIndicatorSize + 'px';
    }

    // 更新默认容差值（如果有使用）
    updateEraserTolerance(eraserIndicatorSize);

    // 如果需要保存到用户配置，调用Python函数
    if (saveToProfile === true) {
        // 调用Python保存橡皮擦大小的函数
        pycmd(`ankidraw:save_eraser_size:${eraserIndicatorSize}`);
    }
}

/**
 * 根据橡皮擦大小更新擦除容差
 * @param {number} size - 橡皮擦大小
 */
function updateEraserTolerance(size) {
    // 可以根据橡皮擦大小调整擦除容差
    // 这里暂时不做操作，因为我们在getEraserTolerance函数中处理容差
}

/**
 * 切换框选擦除模式
 * @param {boolean} enabled - 是否启用框选擦除模式
 */
function toggleRectangleEraseMode(enabled) {
    rectangleEraseMode = enabled;

    // 更新UI状态
    var checkbox = document.getElementById('rectangle-erase-checkbox');
    if (checkbox) {
        checkbox.checked = enabled;
    }

    // 更新指示器样式
    if (eraserIndicator) {
        if (enabled) {
            // 在框选模式下，使用不同的光标样式
            eraserIndicator.style.borderRadius = '0';
            eraserIndicator.style.border = '1px dashed #2196F3';
            eraserIndicator.style.width = '10px';
            eraserIndicator.style.height = '10px';
        } else {
            // 普通模式下恢复圆形指示器
            eraserIndicator.style.borderRadius = '50%';
            eraserIndicator.style.border = '1px solid #2196F3';
            eraserIndicator.style.width = eraserIndicatorSize + 'px';
            eraserIndicator.style.height = eraserIndicatorSize + 'px';
        }
    }

    // 创建选框元素
    createRectangleSelectBox();
}

/**
 * Toggle eraser mode on or off
 * @param {boolean} [force] - Optional parameter to force a specific state
 * @param {boolean} [isSideButtonMode] - Whether this is triggered by side button
 */
function toggleEraser(force, isSideButtonMode) {
    // 首先检查是否处于笔端擦除模式，如果是，则不响应切换橡皮擦操作
    if (typeof isPenEraserActive !== 'undefined' && isPenEraserActive) {
        // 笔端擦除模式下，要求关闭普通橡皮擦
        if (force === true) {
            // 这是明确要求激活普通橡皮擦时，向控制台输出信息而不执行操作
            console.log('AnkiDraw: Cannot enable standard eraser while pen eraser is active');
            return; // 终止执行
        } else if (force === false) {
            // 如果明确要求关闭普通橡皮擦，允许执行
            eraserMode = false;
        } else {
            // 这是通过点击工具栏来切换橡皮擦时，不执行操作
            console.log('AnkiDraw: Cannot toggle standard eraser while pen eraser is active');
            return; // 终止执行
        }
    } else {
        // 正常情况下的橡皮擦切换逻辑
        if (force !== undefined) {
            eraserMode = force;
        } else {
            eraserMode = !eraserMode;
        }
    }

    isEraserDragging = false; // Reset dragging state
    var button = document.getElementById('ts_eraser_button');
    var ts_write_button = document.getElementById('ts_write_button');

    // 更新橡皮擦按钮的状态
    if (button) {
        button.classList.toggle('active', eraserMode);
        if (button.className.includes('active')) {
            ts_write_button.className = ts_write_button.className.replace(/\bactive\b/g, '');
        } else {
            ts_write_button.className = ts_write_button.className = 'active';
        }

        // 处理侧键模式特殊样式
        if (isSideButtonMode && eraserMode) {
            button.classList.add('side-button-active');
        } else if (!isSideButtonMode || !eraserMode) {
            // 非侧键模式或橡皮擦关闭时，移除侧键样式
            button.classList.remove('side-button-active');

            // 移除提示文本
            var hint = document.getElementById('side-button-mode-hint');
            if (hint) {
                hint.parentNode.removeChild(hint);
            }
        }
    }

    // 如果启用橡皮擦，确保禁用笔端擦除
    if (eraserMode && typeof isPenEraserActive !== 'undefined') {
        isPenEraserActive = false;
    }

    // If activating eraser, deactivate other tools (unless it's side button mode)
    if (eraserMode && !isSideButtonMode) {
        // Deactivate perfect freehand if it's active
        if (perfectFreehand) {
            perfectFreehand = false;
            var pfButton = document.getElementById('ts_perfect_freehand_button');
            if (pfButton) {
                pfButton.classList.remove('active');
            }
        }

        // Deactivate calligraphy if it's active
        if (calligraphy) {
            calligraphy = false;
            var calliButton = document.getElementById('ts_kanji_button');
            if (calliButton) {
                calliButton.classList.remove('active');
            }
        }

        // Deactivate line mode if it's active
        if (lineMode) {
            lineMode = false;
            var lineButton = document.getElementById('ts_line_button');
            if (lineButton) {
                lineButton.className = '';
            }
        }

        // Deactivate rectangle mode if it's active
        if (typeof rectangleMode !== 'undefined' && rectangleMode) {
            rectangleMode = false;
            var rectangleButton = document.getElementById('ts_rectangle_button');
            if (rectangleButton) {
                rectangleButton.className = '';
            }
        }
    }

    // 创建并显示/隐藏指示器
    createEraserIndicator();
    if (eraserIndicator) {
        eraserIndicator.style.display = eraserMode ? 'block' : 'none';

        // 橡皮擦大小只在第一次创建时检查，不在每次激活时重设
        if (eraserIndicatorSize === 0) {
            eraserIndicatorSize = defaultEraserSize;
        }

        // 根据当前模式更新指示器样式
        if (rectangleEraseMode) {
            eraserIndicator.style.borderRadius = '0';
            eraserIndicator.style.border = '1px dashed #2196F3';
            eraserIndicator.style.width = '10px';
            eraserIndicator.style.height = '10px';
        } else {
            eraserIndicator.style.borderRadius = '50%';
            eraserIndicator.style.border = '1px solid #2196F3';
            eraserIndicator.style.width = eraserIndicatorSize + 'px';
            eraserIndicator.style.height = eraserIndicatorSize + 'px';
        }

        // 侧键模式时添加特殊样式
        if (isSideButtonMode && eraserMode) {
            eraserIndicator.style.boxShadow = '0 0 0 2px rgba(33, 150, 243, 0.5)';
        } else {
            eraserIndicator.style.boxShadow = 'none';
        }
    }

    // 创建框选选择框
    createRectangleSelectBox();

    // Update event listeners based on eraser mode
    updateEraserEventListeners();
}

/**
 * Setup or remove eraser event listeners based on current mode
 */
function updateEraserEventListeners() {
    if (eraserMode) {
        // Add eraser event listeners for click and drag operations
        canvas.addEventListener('pointerdown', startEraserDrag);
        canvas.addEventListener('pointermove', handleEraserMove);
        canvas.addEventListener('pointerup', stopEraserDrag);

        // When eraser is active, remove the regular drawing handlers
        canvas.removeEventListener('pointerdown', pointerDownLine);

        // 移除矩形工具事件处理 - 防止橡皮擦模式下绘制矩形
        if (typeof pointerDownRectangle === 'function') {
            canvas.removeEventListener('pointerdown', pointerDownRectangle);
            canvas.removeEventListener('pointermove', pointerMoveRectangle);
            window.removeEventListener('pointerup', pointerUpRectangle);
        }

        // Add the noEraser class to disable other pointer behaviors
        document.body.classList.add('eraser-active');
    } else {
        // Remove eraser event listeners
        canvas.removeEventListener('pointerdown', startEraserDrag);
        canvas.removeEventListener('pointermove', handleEraserMove);
        canvas.removeEventListener('pointerup', stopEraserDrag);

        // Restore regular drawing handlers
        canvas.addEventListener('pointerdown', pointerDownLine);

        // 恢复矩形工具事件处理 - 如果矩形模式仍然激活
        if (typeof pointerDownRectangle === 'function' && typeof rectangleMode !== 'undefined' && rectangleMode) {
            canvas.addEventListener('pointerdown', pointerDownRectangle);
            canvas.addEventListener('pointermove', pointerMoveRectangle);
            window.addEventListener('pointerup', pointerUpRectangle);
        }

        // Remove the noEraser class
        document.body.classList.remove('eraser-active');
    }
}

/**
 * Start the eraser drag operation
 * @param {PointerEvent} e - The pointer event
 */
function startEraserDrag(e) {
    if (!eraserMode) return;

    isEraserDragging = true;
    e.preventDefault();

    if (rectangleEraseMode) {
        // 记录框选的起始点
        rectangleStartPoint = { x: e.offsetX, y: e.offsetY };
        rectangleCurrentPoint = { x: e.offsetX, y: e.offsetY };

        // 显示选择框并设置初始位置
        if (rectangleSelectBox) {
            rectangleSelectBox.style.display = 'block';
            updateRectangleSelectBox();
        }
    } else {
        // 普通擦除模式：立即处理擦除操作
        handleEraserDrag(e);
    }
}

/**
 * Stop the eraser drag operation
 */
function stopEraserDrag() {
    if (rectangleEraseMode && rectangleStartPoint && rectangleCurrentPoint) {
        // 执行框选区域内的擦除
        eraseRectangleArea();

        // 隐藏选择框
        if (rectangleSelectBox) {
            rectangleSelectBox.style.display = 'none';
        }

        // 重置框选点
        rectangleStartPoint = null;
        rectangleCurrentPoint = null;
    }

    isEraserDragging = false;

    // 如果之前有擦除操作，确保保存笔迹
    if (typeof line_type_history !== 'undefined' && line_type_history.includes('E')) {
        // 标记笔迹已变化，触发保存
        if (typeof strokesChanged !== 'undefined' && typeof save_strokes_debounced === 'function') {
            strokesChanged = true;
            save_strokes_debounced();
            console.log('AnkiDraw Debug: 橡皮擦操作结束，触发保存');
        }
    }
}

/**
 * 根据当前框选状态更新选择框位置和大小
 */
function updateRectangleSelectBox() {
    if (!rectangleSelectBox || !rectangleStartPoint || !rectangleCurrentPoint) return;

    var rect = canvas.getBoundingClientRect();

    // 计算选择框的位置和大小
    var left = Math.min(rectangleStartPoint.x, rectangleCurrentPoint.x);
    var top = Math.min(rectangleStartPoint.y, rectangleCurrentPoint.y);
    var width = Math.abs(rectangleStartPoint.x - rectangleCurrentPoint.x);
    var height = Math.abs(rectangleStartPoint.y - rectangleCurrentPoint.y);

    // 设置选择框样式
    rectangleSelectBox.style.left = (rect.left + left) + 'px';
    rectangleSelectBox.style.top = (rect.top + top) + 'px';
    rectangleSelectBox.style.width = width + 'px';
    rectangleSelectBox.style.height = height + 'px';
}

/**
 * 擦除框选区域内的所有线条
 */
function eraseRectangleArea() {
    if (!rectangleStartPoint || !rectangleCurrentPoint) return;

    // 计算选择框区域
    var left = Math.min(rectangleStartPoint.x, rectangleCurrentPoint.x);
    var top = Math.min(rectangleStartPoint.y, rectangleCurrentPoint.y);
    var right = Math.max(rectangleStartPoint.x, rectangleCurrentPoint.x);
    var bottom = Math.max(rectangleStartPoint.y, rectangleCurrentPoint.y);

    var strokesRemoved = false;

    // 检查并删除普通笔画
    for (var i = arrays_of_points.length - 1; i >= 0; i--) {
        if (isStrokeInRectangle(arrays_of_points[i], left, top, right, bottom)) {
            // 删除笔画
            arrays_of_points.splice(i, 1);
            perfect_cache.splice(i, 1);
            line_type_history.splice(i, 1);
            strokesRemoved = true;
        }
    }

    // 检查并删除书法笔画
    if (typeof strokes !== 'undefined' && strokes.length > 0) {
        for (var i = strokes.length - 1; i >= 0; i--) {
            if (isCalligraphyStrokeInRectangle(strokes[i], left, top, right, bottom)) {
                strokes.splice(i, 1);
                // 需要删除相应的历史记录
                for (var j = line_type_history.length - 1; j >= 0; j--) {
                    if (line_type_history[j] === 'C') {
                        line_type_history.splice(j, 1);
                        break;
                    }
                }
                strokesRemoved = true;
            }
        }
    }

    // 重绘画布
    if (strokesRemoved) {
        // 添加擦除操作到历史记录
        line_type_history.push('E'); // 'E' 表示 Eraser操作

        ts_redraw();

        // 标记笔迹已变化，触发保存
        if (typeof strokesChanged !== 'undefined' && typeof save_strokes_debounced === 'function') {
            strokesChanged = true;
            save_strokes_debounced();
            console.log('AnkiDraw Debug: 框选擦除操作完成，触发保存');
        }
    }
}

/**
 * 判断笔画是否在矩形区域内
 * @param {Array} stroke - 笔画点数组
 * @param {number} left - 左边界
 * @param {number} top - 上边界
 * @param {number} right - 右边界
 * @param {number} bottom - 下边界
 * @returns {boolean} - 如果笔画任何部分在区域内则返回true
 */
function isStrokeInRectangle(stroke, left, top, right, bottom) {
    // 检查笔画中的每个点是否在矩形内
    for (var i = 0; i < stroke.length; i++) {
        var point = stroke[i];
        var x = point[0];
        var y = point[1];

        if (x >= left && x <= right && y >= top && y <= bottom) {
            return true;
        }
    }

    // 检查笔画线段是否与矩形相交
    for (var i = 0; i < stroke.length - 1; i++) {
        var p1 = { x: stroke[i][0], y: stroke[i][1] };
        var p2 = { x: stroke[i + 1][0], y: stroke[i + 1][1] };

        // 检查线段是否与矩形的任意边相交
        if (lineIntersectsRectangle(p1, p2, left, top, right, bottom)) {
            return true;
        }
    }

    return false;
}

/**
 * 判断书法笔画是否在矩形区域内
 * @param {Object} stroke - 书法笔画对象
 * @param {number} left - 左边界
 * @param {number} top - 上边界
 * @param {number} right - 右边界
 * @param {number} bottom - 下边界
 * @returns {boolean} - 如果笔画任何部分在区域内则返回true
 */
function isCalligraphyStrokeInRectangle(stroke, left, top, right, bottom) {
    // 遍历笔画的所有曲线
    for (var i = 0; i < stroke.curves.length; i++) {
        var curve = stroke.curves[i];
        // 检查曲线的每个控制点
        for (var j = 0; j < curve.length; j++) {
            var x = curve[j].x;
            var y = curve[j].y;

            if (x >= left && x <= right && y >= top && y <= bottom) {
                return true;
            }
        }

        // 检查曲线段是否与矩形相交（简化检查）
        for (var j = 0; j < curve.length - 1; j++) {
            var p1 = { x: curve[j].x, y: curve[j].y };
            var p2 = { x: curve[j + 1].x, y: curve[j + 1].y };

            if (lineIntersectsRectangle(p1, p2, left, top, right, bottom)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * 判断线段是否与矩形相交
 * @param {Object} p1 - 线段起点 {x, y}
 * @param {Object} p2 - 线段终点 {x, y}
 * @param {number} left - 矩形左边界
 * @param {number} top - 矩形上边界
 * @param {number} right - 矩形右边界
 * @param {number} bottom - 矩形下边界
 * @returns {boolean} - 如果线段与矩形相交则返回true
 */
function lineIntersectsRectangle(p1, p2, left, top, right, bottom) {
    // 矩形的四条边
    var edges = [
        { p1: { x: left, y: top }, p2: { x: right, y: top } },     // 上边
        { p1: { x: right, y: top }, p2: { x: right, y: bottom } }, // 右边
        { p1: { x: right, y: bottom }, p2: { x: left, y: bottom } }, // 下边
        { p1: { x: left, y: bottom }, p2: { x: left, y: top } }    // 左边
    ];

    // 检查线段是否与任意边相交
    for (var i = 0; i < edges.length; i++) {
        if (lineIntersectsLine(p1, p2, edges[i].p1, edges[i].p2)) {
            return true;
        }
    }

    return false;
}

/**
 * 判断两条线段是否相交
 * @param {Object} p1 - 第一条线段的起点 {x, y}
 * @param {Object} p2 - 第一条线段的终点 {x, y}
 * @param {Object} p3 - 第二条线段的起点 {x, y}
 * @param {Object} p4 - 第二条线段的终点 {x, y}
 * @returns {boolean} - 如果两条线段相交则返回true
 */
function lineIntersectsLine(p1, p2, p3, p4) {
    // 计算方向
    var d1 = direction(p3, p4, p1);
    var d2 = direction(p3, p4, p2);
    var d3 = direction(p1, p2, p3);
    var d4 = direction(p1, p2, p4);

    // 判断是否相交
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }

    // 检查共线情况
    if (d1 === 0 && onSegment(p3, p4, p1)) return true;
    if (d2 === 0 && onSegment(p3, p4, p2)) return true;
    if (d3 === 0 && onSegment(p1, p2, p3)) return true;
    if (d4 === 0 && onSegment(p1, p2, p4)) return true;

    return false;
}

/**
 * 计算线段方向
 * @param {Object} p1 - 点1 {x, y}
 * @param {Object} p2 - 点2 {x, y}
 * @param {Object} p3 - 点3 {x, y}
 * @returns {number} - 方向值
 */
function direction(p1, p2, p3) {
    return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}

/**
 * 判断点是否在线段上
 * @param {Object} p1 - 线段起点 {x, y}
 * @param {Object} p2 - 线段终点 {x, y}
 * @param {Object} p - 要检查的点 {x, y}
 * @returns {boolean} - 如果点在线段上则返回true
 */
function onSegment(p1, p2, p) {
    return (p.x <= Math.max(p1.x, p2.x) && p.x >= Math.min(p1.x, p2.x) &&
        p.y <= Math.max(p1.y, p2.y) && p.y >= Math.min(p1.y, p2.y));
}

/**
 * Handle eraser movement
 * @param {PointerEvent} e - The pointer event
 */
function handleEraserMove(e) {
    // 更新指示器位置
    updateEraserIndicator(e.clientX, e.clientY);

    // 如果在框选模式且正在拖拽，更新选择框
    if (rectangleEraseMode && isEraserDragging && rectangleStartPoint) {
        rectangleCurrentPoint = { x: e.offsetX, y: e.offsetY };
        updateRectangleSelectBox();
    } else if (isEraserDragging) {
        // 普通擦除模式：执行擦除
        handleEraserDrag(e);
    }
}

/**
 * Handle eraser drag action
 * @param {PointerEvent} e - The pointer event
 */
function handleEraserDrag(e) {
    if (!isEraserDragging) return;

    var clickPoint = [e.offsetX, e.offsetY];
    var strokeRemoved = false;

    // Reverse iterate through strokes to prioritize top-most strokes
    for (var i = arrays_of_points.length - 1; i >= 0; i--) {
        if (isPointInStroke(clickPoint, arrays_of_points[i])) {
            // Remove the stroke
            arrays_of_points.splice(i, 1);
            perfect_cache.splice(i, 1);
            line_type_history.splice(i, 1);

            strokeRemoved = true;
            // Only remove one stroke per drag point to match natural eraser behavior
            break;
        }
    }

    // Also check calligraphy strokes if they exist
    if (!strokeRemoved && typeof strokes !== 'undefined' && strokes.length > 0) {
        for (var i = strokes.length - 1; i >= 0; i--) {
            // For calligraphy, we'll use a simpler check based on segments
            if (isPointNearCalligraphyStroke(clickPoint, strokes[i])) {
                strokes.splice(i, 1);
                // Need to remove the corresponding history entry
                for (var j = line_type_history.length - 1; j >= 0; j--) {
                    if (line_type_history[j] === 'C') {
                        line_type_history.splice(j, 1);
                        break;
                    }
                }
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

/**
 * Check if a point is within a stroke's area
 * @param {Array} point - The point coordinates [x, y]
 * @param {Array} strokePoints - Array of stroke points
 * @returns {boolean} - True if point is in stroke
 */
function isPointInStroke(point, strokePoints) {
    // 使用橡皮擦大小作为基础，但最小保持为1像素
    var tolerance = Math.max(eraserIndicatorSize / 2, 1);

    // 如果是直线（只有两个点）
    if (strokePoints.length === 2) {
        var p1 = strokePoints[0];
        var p2 = strokePoints[1];

        // 确保p1和p2是数组形式的点
        if (!Array.isArray(p1)) {
            // 如果p1是对象形式的点（如{x:10, y:20}），转换为数组形式
            p1 = [p1.x, p1.y];
        }

        if (!Array.isArray(p2)) {
            // 如果p2是对象形式的点（如{x:10, y:20}），转换为数组形式
            p2 = [p2.x, p2.y];
        }

        return distanceToSegment(point, p1, p2) < tolerance;
    }

    // Check point-to-segment distance for each segment in the stroke
    for (var i = 0; i < strokePoints.length - 1; i++) {
        var p1 = strokePoints[i];
        var p2 = strokePoints[i + 1];

        // 确保p1和p2是数组形式的点
        if (!Array.isArray(p1)) {
            // 如果p1是对象形式的点（如{x:10, y:20}），转换为数组形式
            p1 = [p1.x, p1.y];
        }

        if (!Array.isArray(p2)) {
            // 如果p2是对象形式的点（如{x:10, y:20}），转换为数组形式
            p2 = [p2.x, p2.y];
        }

        if (distanceToSegment(point, p1, p2) < tolerance) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a point is near a calligraphy stroke (simplified check)
 * @param {Array} point - The point coordinates [x, y]
 * @param {Stroke} stroke - The calligraphy stroke object
 * @returns {boolean} - True if point is near the stroke
 */
function isPointNearCalligraphyStroke(point, stroke) {
    // Calligraphy strokes are more complex, so we'll do a simplified check
    // against each segment's control points

    // 使用橡皮擦大小作为基础，但最小保持为1像素
    var tolerance = Math.max(eraserIndicatorSize / 2, 1);

    // 检查函数isPointNearCalligraphyStrokeWithTolerance是否存在
    if (typeof isPointNearCalligraphyStrokeWithTolerance === 'function') {
        return isPointNearCalligraphyStrokeWithTolerance(point, stroke);
    }

    // Check against each segment's control points
    for (var i = 0; i < stroke.segments.length; i++) {
        var segment = stroke.segments[i];
        var controlPoints = segment.controlPoints;

        // Check each control point
        for (var j = 0; j < controlPoints.length - 1; j++) {
            var p1 = controlPoints[j];
            var p2 = controlPoints[j + 1];

            if (distanceToSegment(point, p1, p2) < tolerance) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Calculate the minimum distance from a point to a line segment
 * @param {Array} p - The point to check [x, y]
 * @param {Array} v - First point of the segment [x, y]
 * @param {Array} w - Second point of the segment [x, y]
 * @returns {number} - The minimum distance
 */
function distanceToSegment(p, v, w) {
    // 确保所有输入都是数组形式的点
    p = Array.isArray(p) ? p : [p.x, p.y];
    v = Array.isArray(v) ? v : [v.x, v.y];
    w = Array.isArray(w) ? w : [w.x, w.y];

    var l2 = distanceSquared(v, w);

    // 如果线段长度为0，则返回点到起点的距离
    if (l2 === 0) return distance(p, v);

    // 计算向量外积，判断点与线段的位置关系
    var t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;

    // 如果t超出[0,1]范围，则点到线段最近的点是线段的端点
    if (t < 0) return distance(p, v);
    if (t > 1) return distance(p, w);

    // 计算点到线段的最短距离
    var projection = [
        v[0] + t * (w[0] - v[0]),
        v[1] + t * (w[1] - v[1])
    ];

    return distance(p, projection);
}

/**
 * Calculate the squared distance between two points
 * @param {Array} p1 - First point [x, y]
 * @param {Array} p2 - Second point [x, y]
 * @returns {number} - The squared distance
 */
function distanceSquared(p1, p2) {
    return Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2);
}

/**
 * Calculate the distance between two points
 * @param {Array} p1 - First point [x, y]
 * @param {Array} p2 - Second point [x, y]
 * @returns {number} - The distance
 */
function distance(p1, p2) {
    return Math.sqrt(distanceSquared(p1, p2));
}

/**
 * Setup eraser events
 */
function setupEraserEvents() {
    // 设置橡皮擦按钮的双击事件
    var eraserButton = document.getElementById('ts_eraser_button');
    if (eraserButton) {
        // 移除可能存在的旧事件处理器
        eraserButton.removeEventListener('dblclick', handleEraserButtonDblClick);
        eraserButton.removeEventListener('click', handleEraserButtonClick);

        // 添加双击事件处理器
        eraserButton.addEventListener('dblclick', handleEraserButtonDblClick);

        // 添加单击事件处理器
        eraserButton.addEventListener('click', handleEraserButtonClick);
    }

    // 添加点击空白处隐藏滚动条的事件处理
    document.addEventListener('click', function (e) {
        // 如果滚动条存在且可见
        if (eraserSizeSlider && eraserSizeSlider.style.display === 'block') {
            // 检查点击是否在滚动条容器外
            var isOutsideSlider = !eraserSizeSlider.contains(e.target);
            // 检查点击是否不是橡皮擦按钮（避免与双击事件冲突）
            var isNotEraserButton = eraserButton && !eraserButton.contains(e.target);

            if (isOutsideSlider && isNotEraserButton) {
                // 点击在滚动条外部，立即隐藏滚动条
                hideEraserSizeSlider();
            }
        }
    });
}

/**
 * 处理橡皮擦按钮的点击事件
 * @param {MouseEvent} e - 鼠标事件
 */
function handleEraserButtonClick(e) {
    // 切换橡皮擦状态
    toggleEraser();
}

/**
 * 处理橡皮擦按钮的双击事件
 * @param {MouseEvent} e - 鼠标事件
 */
function handleEraserButtonDblClick(e) {
    e.preventDefault();
    e.stopPropagation();

    // 确保橡皮擦模式已激活
    if (!eraserMode) {
        toggleEraser(true); // 如果未激活，则激活橡皮擦
    }

    // 显示设置面板
    showEraserSizeSlider();
}

// 当DOM加载完成后，设置橡皮擦事件
document.addEventListener('DOMContentLoaded', function () {
    setupEraserEvents();
});

// 如果DOM已经加载完成，立即设置
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupEraserEvents();
}

// 在页面卸载时清理指示器
window.addEventListener('unload', function () {
    if (eraserIndicator && eraserIndicator.parentNode) {
        eraserIndicator.parentNode.removeChild(eraserIndicator);
    }
}); 