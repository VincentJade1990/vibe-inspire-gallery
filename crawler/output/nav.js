// ============================================================
// nav.js — VibeBubble 统一导航栏组件 (SPA 客户端路由版)
// 在 HTML 中引入：<script src="./nav.js"></script>
// 需在 auth.js 之后引入
// ============================================================

(function () {
  'use strict';

  // ===== 导航配置 =====
  var NAV_ITEMS = [
    { label: 'Home', href: './', key: 'home' },
    { label: 'Explore', href: './gallery', key: 'explore' },
    { label: 'Learning', href: './learning', key: 'learning' },
    { label: 'Space', href: './space', key: 'space' },
    { label: 'Studio', href: './studio', key: 'studio' }
  ];

  // SPA 路由配置
  var SPA_NAV_KEYS = ['home', 'explore', 'learning', 'space', 'studio'];
  var isNavigating = false;
  var loadedExternalScripts = {};

  // 根据当前页面文件名推断 active key
  function getActiveKey() {
    var path = window.location.pathname;
    var file = path.substring(path.lastIndexOf('/') + 1).toLowerCase();

    if (file === '' || file === 'index.html' || file === 'index') return 'home';
    if (file === 'gallery.html' || file === 'gallery') return 'explore';
    if (file === 'learning.html' || file === 'learning') return 'learning';
    if (file === 'space.html' || file === 'space' || file === 'profile.html' || file === 'profile') return 'space';
    if (file === 'studio.html' || file === 'studio' || file === 'about.html' || file === 'about') return 'studio';
    return '';
  }

  // 注入 CSS（仅一次）
  function injectStyles() {
    if (document.getElementById('vb-nav-styles')) return;
    var style = document.createElement('style');
    style.id = 'vb-nav-styles';
    style.textContent = [
      '/* ===== VibeBubble 统一导航栏 ===== */',
      'html { scrollbar-gutter: stable; }',
      '.vb-site-nav {',
      '  position: fixed;',
      '  top: 0; right: 0; left: 0;',
      '  z-index: 100;',
      '  height: 68px;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: space-between;',
      '  padding: 0 4vw;',
      '  background: rgba(5, 5, 16, 0.72);',
      '  border-bottom: 1px solid rgba(255, 255, 255, 0.06);',
      '  backdrop-filter: blur(24px) saturate(1.35);',
      '  -webkit-backdrop-filter: blur(24px) saturate(1.35);',
      '}',
      '',
      '/* 左上角 Logo */',
      '.vb-nav-brand {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 10px;',
      '  text-decoration: none;',
      '  color: inherit;',
      '  font-size: 18px;',
      '  font-weight: 750;',
      '  letter-spacing: 0.16em;',
      '  flex-shrink: 0;',
      '}',
      '.vb-nav-brand-dot {',
      '  width: 18px;',
      '  height: 18px;',
      '  border-radius: 50%;',
      '  background: radial-gradient(circle at 35% 35%, #fff, #c4b5fd 35%, #a855f7 70%);',
      '  box-shadow: 0 0 18px rgba(168, 85, 247, 0.9);',
      '  flex-shrink: 0;',
      '}',
      '',
      '/* 中间导航 */',
      '.vb-nav-links {',
      '  position: absolute;',
      '  left: 50%;',
      '  top: 50%;',
      '  transform: translate(-50%, -50%);',
      '  display: flex;',
      '  gap: 32px;',
      '  align-items: center;',
      '}',
      '.vb-nav-links a {',
      '  color: rgba(255, 255, 255, 0.5);',
      '  font-size: 14px;',
      '  font-weight: 400;',
      '  letter-spacing: 0.14em;',
      '  text-decoration: none;',
      '  position: relative;',
      '  padding: 4px 0;',
      '  transform: translateZ(0);',
      '  backface-visibility: hidden;',
      '  cursor: pointer;',
      '}',
      '.vb-nav-links a:hover {',
      '  color: #c4b5fd;',
      '}',
      '.vb-nav-links a.vb-active {',
      '  color: #c4b5fd;',
      '}',
      '.vb-nav-links a.vb-active::after {',
      '  content: "";',
      '  position: absolute;',
      '  bottom: -2px;',
      '  left: 0; right: 0;',
      '  height: 1px;',
      '  background: #c4b5fd;',
      '}',
      '',
      '/* 右上角 Create 按钮 / 用户状态 */',
      '.vb-nav-right {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 12px;',
      '  flex-shrink: 0;',
      '}',
      '.vb-create-btn {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  padding: 9px 20px;',
      '  border: none;',
      '  border-radius: 999px;',
      '  background: linear-gradient(135deg, #a855f7, #6366f1);',
      '  color: #fff;',
      '  font-size: 14px;',
      '  font-weight: 700;',
      '  letter-spacing: 0.12em;',
      '  cursor: pointer;',
      '  text-decoration: none;',
      '  transition: all 240ms ease;',
      '  white-space: nowrap;',
      '}',
      '.vb-create-btn:hover {',
      '  transform: translateY(-1px);',
      '  box-shadow: 0 6px 24px rgba(168, 85, 247, 0.4);',
      '}',
      '.vb-create-btn:active {',
      '  transform: scale(0.97);',
      '}',
      '.vb-create-btn svg {',
      '  width: 13px; height: 13px;',
      '}',
      '',
      '/* 音效静音按钮 */',
      '.vb-sound-btn {',
      '  width: 32px;',
      '  height: 32px;',
      '  border-radius: 50%;',
      '  border: 1px solid rgba(255,255,255,0.08);',
      '  background: rgba(255,255,255,0.04);',
      '  color: rgba(255,255,255,0.5);',
      '  cursor: pointer;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  transition: all 240ms ease;',
      '  flex-shrink: 0;',
      '}',
      '.vb-sound-btn:hover {',
      '  border-color: rgba(168,85,247,0.4);',
      '  background: rgba(168,85,247,0.1);',
      '  color: #c4b5fd;',
      '}',
      '.vb-sound-btn.muted {',
      '  opacity: 0.4;',
      '}',
      '.vb-sound-btn.vb-sound-hidden {',
      '  visibility: hidden;',
      '}',
      '.vb-sound-btn svg {',
      '  width: 14px; height: 14px;',
      '}',
      '.vb-sound-on { display: block; }',
      '.vb-sound-off { display: none; }',
      '.vb-sound-btn.muted .vb-sound-on { display: none; }',
      '.vb-sound-btn.muted .vb-sound-off { display: block; }',
      '',
      '/* 已登录用户按钮 */',
      '.vb-user-btn {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  padding: 5px 14px 5px 5px;',
      '  border: 1px solid rgba(255,255,255,0.1);',
      '  border-radius: 999px;',
      '  background: rgba(255,255,255,0.04);',
      '  color: #f8fafc;',
      '  font-size: 14px;',
      '  cursor: pointer;',
      '  text-decoration: none;',
      '  transition: all 240ms ease;',
      '  white-space: nowrap;',
      '}',
      '.vb-user-btn:hover {',
      '  background: rgba(168,85,247,0.1);',
      '  border-color: rgba(168,85,247,0.3);',
      '}',
      '.vb-user-avatar {',
      '  width: 28px; height: 28px;',
      '  border-radius: 50%;',
      '  background: linear-gradient(135deg, #a855f7, #6366f1);',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  font-size: 11px;',
      '  font-weight: 700;',
      '  color: #fff;',
      '  flex-shrink: 0;',
      '}',
      '',
      '/* 汉堡菜单按钮 */',
      '.vb-hamburger {',
      '  display: none;',
      '  flex-direction: column;',
      '  gap: 4px;',
      '  padding: 8px;',
      '  background: none;',
      '  border: none;',
      '  cursor: pointer;',
      '}',
      '.vb-hamburger span {',
      '  width: 20px; height: 2px;',
      '  background: rgba(255,255,255,0.7);',
      '  border-radius: 1px;',
      '  transition: all 240ms ease;',
      '}',
      '.vb-hamburger.vb-open span:nth-child(1) {',
      '  transform: rotate(45deg) translate(4px, 4px);',
      '}',
      '.vb-hamburger.vb-open span:nth-child(2) {',
      '  opacity: 0;',
      '}',
      '.vb-hamburger.vb-open span:nth-child(3) {',
      '  transform: rotate(-45deg) translate(4px, -4px);',
      '}',
      '',
      '/* 移动端下拉面板 */',
      '.vb-mobile-panel {',
      '  position: fixed;',
      '  top: 68px; left: 0; right: 0;',
      '  z-index: 99;',
      '  background: rgba(5, 5, 16, 0.96);',
      '  border-bottom: 1px solid rgba(255,255,255,0.08);',
      '  backdrop-filter: blur(24px);',
      '  -webkit-backdrop-filter: blur(24px);',
      '  padding: 16px 24px 24px;',
      '  display: none;',
      '  flex-direction: column;',
      '  gap: 4px;',
      '}',
      '.vb-mobile-panel.vb-show {',
      '  display: flex;',
      '}',
      '.vb-mobile-panel a {',
      '  padding: 14px 0;',
      '  color: rgba(255,255,255,0.6);',
      '  font-size: 14px;',
      '  font-weight: 600;',
      '  letter-spacing: 0.1em;',
      '  text-decoration: none;',
      '  border-bottom: 1px solid rgba(255,255,255,0.04);',
      '  cursor: pointer;',
      '}',
      '.vb-mobile-panel a.vb-active {',
      '  color: #c4b5fd;',
      '}',
      '.vb-mobile-panel .vb-create-btn {',
      '  margin-top: 16px;',
      '  justify-content: center;',
      '}',
      '.vb-mobile-panel .vb-user-btn {',
      '  margin-top: 16px;',
      '  justify-content: center;',
      '}',
      '',
      '/* 子页面返回按钮（detail.html / profile.html） */',
      '.vb-sub-back {',
      '  position: fixed;',
      '  top: 20px; right: 24px;',
      '  z-index: 100;',
      '  display: inline-flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  padding: 8px 16px;',
      '  border-radius: 999px;',
      '  background: rgba(5, 5, 16, 0.72);',
      '  border: 1px solid rgba(255,255,255,0.1);',
      '  backdrop-filter: blur(16px);',
      '  -webkit-backdrop-filter: blur(16px);',
      '  color: rgba(255,255,255,0.7);',
      '  font-size: 11px;',
      '  font-weight: 600;',
      '  letter-spacing: 0.1em;',
      '  text-decoration: none;',
      '  cursor: pointer;',
      '  transition: all 240ms ease;',
      '}',
      '.vb-sub-back:hover {',
      '  color: #c4b5fd;',
      '  border-color: rgba(168,85,247,0.3);',
      '  background: rgba(168,85,247,0.08);',
      '}',
      '.vb-sub-back svg {',
      '  width: 14px; height: 14px;',
      '}',
      '',
      '/* 响应式 */',
      '@media (max-width: 860px) {',
      '  .vb-nav-links { display: none; }',
      '  .vb-nav-right .vb-create-btn,',
      '  .vb-nav-right .vb-user-btn { display: none; }',
      '  .vb-hamburger { display: flex; }',
      '}',
      '@media (max-width: 860px) {',
      '  .vb-site-nav { height: 60px; padding: 0 20px; }',
      '  .vb-mobile-panel { top: 60px; }',
      '}',
      '@media (prefers-reduced-motion: reduce) {',
      '  .vb-hamburger span, .vb-create-btn, .vb-user-btn, .vb-sub-back {',
      '    transition: none !important;',
      '  }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // 获取用户首字母作为头像
  function getInitial(name) {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }

  // 音效按钮 SVG 图标
  var soundIconOn = '<svg class="vb-sound-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  var soundIconOff = '<svg class="vb-sound-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>';

  // 检测当前页面是否有音效（仅 gallery 有）
  function hasAudio() {
    var path = window.location.pathname;
    var file = path.substring(path.lastIndexOf('/') + 1).toLowerCase();
    return file === 'gallery.html' || file === 'gallery';
  }

  // 渲染右上角区域
  function renderRightArea(user, isMobile) {
    var soundHidden = hasAudio() ? '' : ' vb-sound-hidden';
    var soundBtn = '<button class="vb-sound-btn' + soundHidden + '" aria-label="音效开关">' +
      soundIconOn + soundIconOff +
      '</button>';

    if (user) {
      return soundBtn +
        '<a href="./profile" class="vb-user-btn">' +
        '<span class="vb-user-avatar">' + getInitial(user.nickname) + '</span>' +
        '<span>' + escapeHtml(user.nickname) + '</span>' +
        '</a>';
    }
    return soundBtn +
      '<button class="vb-create-btn" id="vb-create-trigger">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>' +
      'CREATE</button>';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // 构建主导航栏 HTML（添加 data-key 属性）
  function buildNavHTML(user) {
    var activeKey = getActiveKey();

    var linksHTML = NAV_ITEMS.map(function (item) {
      var cls = item.key === activeKey ? 'vb-active' : '';
      return '<a href="' + item.href + '" data-key="' + item.key + '" class="' + cls + '">' + item.label + '</a>';
    }).join('');

    var rightHTML = renderRightArea(user, false);

    var mobileLinksHTML = NAV_ITEMS.map(function (item) {
      var cls = item.key === activeKey ? 'vb-active' : '';
      return '<a href="' + item.href + '" data-key="' + item.key + '" class="' + cls + '">' + item.label + '</a>';
    }).join('');
    var mobileRightHTML = renderRightArea(user, true);

    return '' +
      '<header class="vb-site-nav">' +
        '<a class="vb-nav-brand" href="./" aria-label="VibeBubble 首页">' +
          '<span class="vb-nav-brand-dot" aria-hidden="true"></span>' +
          'VIBEBUBBLE' +
        '</a>' +
        '<nav class="vb-nav-links" aria-label="主导航">' + linksHTML + '</nav>' +
        '<div class="vb-nav-right">' +
          rightHTML +
          '<button class="vb-hamburger" id="vb-hamburger" aria-label="菜单" aria-expanded="false">' +
            '<span></span><span></span><span></span>' +
          '</button>' +
        '</div>' +
      '</header>' +
      '<div class="vb-mobile-panel" id="vb-mobile-panel">' +
        mobileLinksHTML +
        mobileRightHTML +
      '</div>';
  }

  // 构建子页面返回按钮 HTML
  function buildSubBackHTML(backHref, backLabel) {
    backHref = backHref || './gallery';
    backLabel = backLabel || 'BACK';
    return '<a class="vb-sub-back" href="' + backHref + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
      backLabel +
      '</a>';
  }

  // ===== SPA 客户端路由 =====

  // 拦截导航链接点击
  function handleNavClick(e) {
    // 修饰键按下时不拦截（允许新标签页打开等）
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var link = e.currentTarget;
    var url = link.getAttribute('href');
    var key = link.getAttribute('data-key');

    // 仅拦截主导航页面
    if (!key || SPA_NAV_KEYS.indexOf(key) === -1) return;

    e.preventDefault();

    // 已在当前页面：仅滚动到顶部
    if (key === getActiveKey()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 关闭移动端菜单
    var panel = document.getElementById('vb-mobile-panel');
    var hamburger = document.getElementById('vb-hamburger');
    if (panel) panel.classList.remove('vb-show');
    if (hamburger) hamburger.classList.remove('vb-open');

    loadPage(url, key, true);
  }

  // 加载目标页面并替换内容
  function loadPage(url, key, pushState) {
    if (isNavigating) return;
    isNavigating = true;

    // 立即更新选中态（视觉即时反馈）
    updateActiveTab(key);

    fetch(url, { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        // 1. 更新页面标题
        document.title = doc.title || 'VibeBubble';

        // 2. 替换页面 CSS（保留 nav 注入的样式）
        swapHeadStyles(doc);

        // 3. 收集需要执行的脚本（跳过已加载的 auth.js / nav.js）
        var scriptsToRun = collectScripts(doc);

        // 4. 替换 body 内容（保留导航栏 DOM）
        swapBodyContent(doc);

        // 5. 更新浏览器 URL（在执行脚本之前，确保相对路径 import 正确解析）
        if (pushState) {
          history.pushState({ url: url, key: key }, '', url);
        }

        // 6. 重新执行脚本
        executeScripts(scriptsToRun);

        // 7. 更新导航栏右侧区域（音效按钮可见性等）
        updateNavAfterRoute(key);

        // 8. 滚动到顶部
        window.scrollTo(0, 0);

        isNavigating = false;
      })
      .catch(function (err) {
        console.error('SPA navigation error:', err);
        // 出错时回退到传统页面跳转
        window.location.href = url;
      });
  }

  // 替换 head 中的页面样式（保留带 id 的动态注入样式）
  function swapHeadStyles(newDoc) {
    // 移除旧的无 id 的 <style> 标签（页面专属 CSS）
    document.head.querySelectorAll('style:not([id])').forEach(function (s) { s.remove(); });
    // 移除旧的 CSS <link> 标签
    document.head.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) { l.remove(); });

    // 添加新页面的 <style> 标签
    newDoc.head.querySelectorAll('style').forEach(function (s) {
      if (s.id) return; // 跳过带 id 的（如 vb-nav-styles）
      document.head.appendChild(s.cloneNode(true));
    });
    // 添加新页面的 CSS <link> 标签
    newDoc.head.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
      document.head.appendChild(l.cloneNode(true));
    });
  }

  // 收集页面脚本（跳过 auth.js 和 nav.js，保留所有原始属性如 type="module"）
  function collectScripts(doc) {
    var scripts = [];
    doc.querySelectorAll('script').forEach(function (s) {
      var src = s.getAttribute('src') || '';
      // 跳过已加载的核心脚本
      if (src.indexOf('auth.js') !== -1 || src.indexOf('nav.js') !== -1) return;
      // 收集所有属性（type, crossorigin, integrity 等）
      var attrs = {};
      for (var i = 0; i < s.attributes.length; i++) {
        attrs[s.attributes[i].name] = s.attributes[i].value;
      }
      scripts.push({ src: src || null, content: s.textContent || null, attrs: attrs });
    });
    return scripts;
  }

  // 执行收集的脚本（保留原始属性，外部脚本去重）
  function executeScripts(scripts) {
    scripts.forEach(function (s) {
      // 外部脚本去重
      if (s.src && loadedExternalScripts[s.src]) return;
      if (s.src) loadedExternalScripts[s.src] = true;

      var script = document.createElement('script');
      // 复制所有原始属性（type="module", crossorigin 等）
      Object.keys(s.attrs).forEach(function (name) {
        script.setAttribute(name, s.attrs[name]);
      });
      // 内联脚本设置内容
      if (!s.src && s.content) {
        script.textContent = s.content;
      }
      document.body.appendChild(script);
    });
  }

  // 替换 body 内容（保留导航栏）
  function swapBodyContent(newDoc) {
    // 1. 暂存导航栏 DOM 节点（保留事件监听器）
    var navMount = document.getElementById('vb-nav-mount');
    if (navMount && navMount.parentNode === document.body) {
      document.body.removeChild(navMount);
    }

    // 2. 清空 body
    document.body.innerHTML = '';

    // 3. 重新挂载导航栏（同一 DOM 节点，事件监听器完整保留）
    if (navMount) {
      document.body.appendChild(navMount);
    }

    // 4. 从新页面提取 body 内容（移除导航栏和已加载脚本）
    var newBody = newDoc.body.cloneNode(true);
    var newNavMount = newBody.querySelector('#vb-nav-mount');
    if (newNavMount) newNavMount.remove();
    // 移除所有脚本（由 executeScripts 统一处理，避免 innerHTML 插入的不执行脚本残留）
    newBody.querySelectorAll('script').forEach(function (s) { s.remove(); });

    // 5. 将新内容追加到 body
    var temp = document.createElement('div');
    temp.innerHTML = newBody.innerHTML;
    while (temp.firstChild) {
      document.body.appendChild(temp.firstChild);
    }
  }

  // 更新导航栏选中态和右侧区域
  function updateActiveTab(key) {
    document.querySelectorAll('.vb-nav-links a, .vb-mobile-panel a').forEach(function (link) {
      var linkKey = link.getAttribute('data-key');
      if (linkKey === key) {
        link.classList.add('vb-active');
      } else {
        link.classList.remove('vb-active');
      }
    });
  }

  // 路由后更新导航栏右侧（音效按钮可见性、事件绑定）
  function updateNavAfterRoute(key) {
    // 更新音效按钮可见性
    document.querySelectorAll('.vb-sound-btn').forEach(function (btn) {
      if (hasAudio()) {
        btn.classList.remove('vb-sound-hidden');
        // 重新绑定音效事件（clone 节点清除旧监听器）
        var newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function () {
          if (typeof toggleSound === 'function') toggleSound();
        });
      } else {
        btn.classList.add('vb-sound-hidden');
      }
    });

    // 重新绑定 Create 按钮事件
    var createBtn = document.getElementById('vb-create-trigger');
    if (createBtn) {
      var newCreate = createBtn.cloneNode(true);
      createBtn.parentNode.replaceChild(newCreate, createBtn);
      newCreate.addEventListener('click', function () {
        if (typeof showAuthModal === 'function') showAuthModal('login');
      });
    }
  }

  // 绑定交互事件
  function bindEvents() {
    // 导航链接点击拦截（SPA 路由）
    document.querySelectorAll('.vb-nav-links a[data-key], .vb-mobile-panel a[data-key]').forEach(function (link) {
      link.addEventListener('click', handleNavClick);
    });

    // Create 按钮触发登录弹窗
    var createBtn = document.getElementById('vb-create-trigger');
    if (createBtn) {
      createBtn.addEventListener('click', function () {
        if (typeof showAuthModal === 'function') {
          showAuthModal('login');
        }
      });
    }

    // 移动端汉堡菜单
    var hamburger = document.getElementById('vb-hamburger');
    var panel = document.getElementById('vb-mobile-panel');
    if (hamburger && panel) {
      hamburger.addEventListener('click', function () {
        var isOpen = panel.classList.toggle('vb-show');
        hamburger.classList.toggle('vb-open', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // 音效静音按钮（仅 gallery 页面绑定事件）
    if (hasAudio()) {
      document.querySelectorAll('.vb-sound-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (typeof toggleSound === 'function') {
            toggleSound();
          }
        });
      });
    }
  }

  // ===== 主入口 =====
  window.VBNav = {
    init: function (options) {
      options = options || {};
      injectStyles();

      if (options.mode === 'sub') {
        // 子页面模式：只渲染返回按钮，不启用 SPA
        var mount = document.getElementById('vb-nav-mount') || document.body;
        mount.insertAdjacentHTML('afterbegin', buildSubBackHTML(options.backHref, options.backLabel));
        return;
      }

      // 主导航模式
      var mount = document.getElementById('vb-nav-mount');
      if (!mount) {
        mount = document.createElement('div');
        mount.id = 'vb-nav-mount';
        document.body.insertBefore(mount, document.body.firstChild);
      }

      // 获取用户状态：优先从 localStorage 读取缓存
      var user = null;
      try {
        var cached = localStorage.getItem('vb_user');
        if (cached) user = JSON.parse(cached);
      } catch (e) { /* ignore */ }
      if (!user && typeof window.currentUser === 'function') {
        user = window.currentUser();
      }

      mount.innerHTML = buildNavHTML(user);
      bindEvents();

      // SPA: 设置 popstate 处理器（浏览器前进/后退）
      window.addEventListener('popstate', function (event) {
        if (isNavigating) return;
        // 直接使用浏览器已更新的 URL，不依赖 state 中的相对路径
        var key = getActiveKey();
        if (key && SPA_NAV_KEYS.indexOf(key) !== -1) {
          loadPage(window.location.href, key, false);
        }
      });

      // SPA: 记录初始页面状态
      var initialKey = getActiveKey();
      history.replaceState({ url: window.location.pathname, key: initialKey }, '', window.location.pathname);

      // 监听 auth 状态变化，重新渲染右上角
      if (typeof onAuthStateChange !== 'undefined') {
        var originalCallback = onAuthStateChange;
        window.onAuthStateChange = function (u) {
          if (typeof originalCallback === 'function') {
            originalCallback(u);
          }
          // 重新渲染导航
          var newMount = document.getElementById('vb-nav-mount');
          if (newMount) {
            newMount.innerHTML = buildNavHTML(u);
            bindEvents();
          }
        };
      }
    }
  };

  // 自动初始化
  function autoInit() {
    if (window.VBNav && !window.VBNav._initialized) {
      window.VBNav._initialized = true;
      var config = window.VBNavConfig || { mode: 'main' };
      window.VBNav.init(config);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(autoInit);
    });
  } else {
    requestAnimationFrame(autoInit);
  }
})();
