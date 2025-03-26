"""
多语言支持模块 for AnkiDraw addon.
"""

import os
import json
from aqt import mw
from aqt.qt import QAction, QDialog, QVBoxLayout, QComboBox, QLabel, QPushButton, QHBoxLayout

# 可用语言列表
AVAILABLE_LANGUAGES = {
    "en": "English",
    "zh_CN": "中文(简体)",
    "fr": "Français",
    "de": "Deutsch",
    "ja": "日本語",
    "es": "Español",
    "ru": "Русский",
    "ar": "العربية"
}

# 默认语言
DEFAULT_LANGUAGE = "en"

# 当前语言
current_language = DEFAULT_LANGUAGE

# 语言数据
_lang_data = {}

# 初始化标记
_initialized = False

# 调试功能
def log_debug(message):
    """
    将调试信息写入日志文件
    """
    try:
        # 注释掉创建日志文件的代码
        # addon_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # log_dir = os.path.join(addon_dir, 'addon_logs')
        # os.makedirs(log_dir, exist_ok=True)
        # log_file = os.path.join(log_dir, 'language_debug.log')
        # timestamp = os.path.getmtime(os.path.join(addon_dir, "__init__.py"))
        # with open(log_file, 'a', encoding='utf-8') as f:
        #     f.write(f"[{timestamp}] {message}\n")
        pass  # 不执行任何操作
    except Exception as e:
        print(f"Error writing to language log: {e}")

def load_language_data(lang_code):
    """加载指定语言的数据"""
    global _lang_data
    
    try:
        # 获取插件目录路径
        addon_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        lang_file = os.path.join(addon_dir, "lang", f"{lang_code}.json")
        
        log_debug(f"尝试加载语言文件: {lang_file}")
        
        # 读取语言文件
        if os.path.exists(lang_file):
            with open(lang_file, "r", encoding="utf-8") as f:
                _lang_data = json.load(f)
            log_debug(f"已成功加载语言: {lang_code}")
        else:
            # 如果找不到语言文件，回退到英语
            fallback_file = os.path.join(addon_dir, "lang", "en.json")
            log_debug(f"找不到语言文件 {lang_file}，回退到: {fallback_file}")
            with open(fallback_file, "r", encoding="utf-8") as f:
                _lang_data = json.load(f)
    except Exception as e:
        log_debug(f"加载语言数据时出错: {e}")
        _lang_data = {}

def get_text(key, default=None):
    """获取指定键的本地化文本"""
    if not _lang_data:
        load_language_data(current_language)
    
    return _lang_data.get(key, default if default is not None else key)

def set_language(lang_code):
    """设置当前语言"""
    global current_language
    
    if lang_code in AVAILABLE_LANGUAGES:
        current_language = lang_code
        # 清空语言数据缓存，以便下次使用时重新加载
        global _lang_data
        _lang_data = {}
        # 保存语言设置
        save_language_setting(lang_code)
        log_debug(f"语言已设置为: {lang_code}")
        return True
    log_debug(f"无效的语言代码: {lang_code}")
    return False

def load_language_setting():
    """从Anki配置加载语言设置"""
    global current_language
    
    try:
        saved_lang = mw.pm.profile.get('ankidraw_language', None)
        log_debug(f"从配置中加载语言设置: {saved_lang}")
        
        if saved_lang and saved_lang in AVAILABLE_LANGUAGES:
            current_language = saved_lang
            log_debug(f"已设置当前语言为: {current_language}")
            return True
    except Exception as e:
        log_debug(f"加载语言设置时出错: {e}")
    
    log_debug(f"使用默认语言: {DEFAULT_LANGUAGE}")
    return False

def save_language_setting(lang_code):
    """保存语言设置到Anki配置"""
    try:
        log_debug(f"正在保存语言设置: {lang_code}")
        mw.pm.profile['ankidraw_language'] = lang_code
        
        # 确保设置立即保存到磁盘
        mw.pm.save()
        
        # 直接输出当前配置以验证保存是否成功
        saved_value = mw.pm.profile.get('ankidraw_language', 'not saved')
        log_debug(f"验证保存结果: {saved_value}")
        
        log_debug(f"语言设置已保存")
        return True
    except Exception as e:
        log_debug(f"保存语言设置时出错: {e}")
        return False

class LanguageSelectDialog(QDialog):
    """语言选择对话框"""
    def __init__(self, parent=None):
        super(LanguageSelectDialog, self).__init__(parent)
        self.setup_ui()
        
    def setup_ui(self):
        """设置对话框UI"""
        self.setWindowTitle(get_text("language_select_title", "Language Selection"))
        self.setMinimumWidth(300)
        
        main_layout = QVBoxLayout()
        
        # 语言选择标签
        label = QLabel(get_text("select_language", "Select Language:"))
        main_layout.addWidget(label)
        
        # 语言下拉框
        self.language_combo = QComboBox()
        for code, name in AVAILABLE_LANGUAGES.items():
            self.language_combo.addItem(name, code)
        
        # 设置当前选中的语言
        for i in range(self.language_combo.count()):
            if self.language_combo.itemData(i) == current_language:
                self.language_combo.setCurrentIndex(i)
                break
                
        main_layout.addWidget(self.language_combo)
        
        # 当前语言状态
        status_label = QLabel(f"当前语言/Current: {AVAILABLE_LANGUAGES.get(current_language, current_language)}")
        main_layout.addWidget(status_label)
        
        # 按钮区域
        buttons_layout = QHBoxLayout()
        
        # 确定按钮
        ok_btn = QPushButton(get_text("ok_button", "OK"))
        ok_btn.clicked.connect(self.accept)
        buttons_layout.addWidget(ok_btn)
        
        # 取消按钮
        cancel_btn = QPushButton(get_text("cancel_button", "Cancel"))
        cancel_btn.clicked.connect(self.reject)
        buttons_layout.addWidget(cancel_btn)
        
        main_layout.addLayout(buttons_layout)
        
        self.setLayout(main_layout)
        
    def get_selected_language(self):
        """获取选择的语言代码"""
        return self.language_combo.currentData()

def show_language_select_dialog():
    """显示语言选择对话框"""
    dialog = LanguageSelectDialog(mw)
    result = dialog.exec()
    if result == QDialog.DialogCode.Accepted:
        new_lang = dialog.get_selected_language()
        log_debug(f"用户选择了语言: {new_lang}")
        if new_lang != current_language:
            # 设置并保存新语言
            set_language(new_lang)
            
            # 将重要设置值输出到日志以便调试
            log_debug(f"当前内存中的语言设置: {current_language}")
            log_debug(f"当前Anki配置中保存的语言设置: {mw.pm.profile.get('ankidraw_language', 'not found')}")
            
            # 确保设置被持久化
            mw.pm.save()
            
            # 提示需要重启Anki以应用更改
            from aqt.utils import showInfo
            showInfo(get_text("restart_required", "Please restart Anki to apply language changes."))
            return True
    return False

def init():
    """初始化语言设置"""
    global _initialized
    
    if _initialized:
        log_debug("语言模块已经初始化，跳过重复初始化")
        return
    
    log_debug("正在初始化语言模块")
    
    # 检查语言数据是否已经加载
    global _lang_data
    if _lang_data:
        log_debug("语言数据已经加载，跳过初始化")
        _initialized = True
        return
    
    # 加载语言设置
    has_loaded = load_language_setting()
    log_debug(f"语言设置加载状态: {has_loaded}, 当前语言: {current_language}")
    
    # 加载语言数据
    load_language_data(current_language)
    
    # 验证加载的语言数据
    log_debug(f"语言数据加载完成，包含 {len(_lang_data)} 个翻译条目")
    log_debug(f"语言初始化完成，当前语言: {current_language}")
    
    # 输出一个示例条目进行验证
    sample_key = "menu_enable_ankidraw"
    log_debug(f"示例翻译条目 '{sample_key}': {_lang_data.get(sample_key, '未找到')}")
    
    _initialized = True 