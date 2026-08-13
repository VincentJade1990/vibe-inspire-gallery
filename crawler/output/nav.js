// ============================================================
// nav.js — VibeBubble 统一导航栏组件
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

  // 根据当前页面文件名推断 active key
  // 兼容 Cloudflare Pages 的 clean URL（无 .html 后缀）和本地开发（有 .html 后缀）
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
  // 注入 View Transitions meta 标签（跨页面导航平滑过渡，消除白屏闪动）
  function injectViewTransition() {
    if (document.querySelector('meta[name=view-transition]')) return;
    var meta = document.createElement('meta');
    meta.name = 'view-transition';
    meta.content = 'same-origin';
    document.head.appendChild(meta);
  }

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

  // 检测当前页面是否有音效（仅 gallery.html 有）
  function hasAudio() {
    var path = window.location.pathname;
    var file = path.substring(path.lastIndexOf('/') + 1).toLowerCase();
    return file === 'gallery.html' || file === 'gallery';
  }

  // 渲染右上角区域（音效按钮 + Create 按钮 或 用户状态）
  // 音效按钮始终渲染，非 gallery 页面用 visibility: hidden 隐藏但保留占位
  function renderRightArea(user, isMobile) {
    var soundHidden = hasAudio() ? '' : ' vb-sound-hidden';
    var soundBtn = '<button class="vb-sound-btn' + soundHidden + '" aria-label="音效开关">' +
      soundIconOn + soundIconOff +
      '</button>';

    if (user) {
      // 已登录：头像 + 昵称，点击进入 profile.html
      return soundBtn +
        '<a href="./profile.html" class="vb-user-btn">' +
        '<span class="vb-user-avatar">' + getInitial(user.nickname) + '</span>' +
        '<span>' + escapeHtml(user.nickname) + '</span>' +
        '</a>';
    }
    // 未登录：Create 按钮
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

  // 构建主导航栏 HTML
  function buildNavHTML(user) {
    var activeKey = getActiveKey();

    var linksHTML = NAV_ITEMS.map(function (item) {
      var cls = item.key === activeKey ? 'vb-active' : '';
      return '<a href="' + item.href + '" class="' + cls + '">' + item.label + '</a>';
    }).join('');

    var rightHTML = renderRightArea(user, false);

    // 移动端面板内容
    var mobileLinksHTML = NAV_ITEMS.map(function (item) {
      var cls = item.key === activeKey ? 'vb-active' : '';
      return '<a href="' + item.href + '" class="' + cls + '">' + item.label + '</a>';
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

  // 绑定交互事件
  function bindEvents() {
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

      // 点击面板内链接后关闭
      panel.querySelectorAll('a, button').forEach(function (el) {
        el.addEventListener('click', function () {
          panel.classList.remove('vb-show');
          hamburger.classList.remove('vb-open');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });

      // 移动端 Create 按钮也触发登录
      var mobileCreate = panel.querySelector('#vb-create-trigger');
      if (mobileCreate) {
        mobileCreate.addEventListener('click', function () {
          if (typeof showAuthModal === 'function') {
            showAuthModal('login');
          }
        });
      }
    }

    // 音效静音按钮（仅 gallery 页面绑定事件）
    if (hasAudio()) {
      var soundBtns = document.querySelectorAll('.vb-sound-btn');
      soundBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (typeof toggleSound === 'function') {
            toggleSound();
          }
        });
      });
    }
  }

  // ===== 主入口 =====
  // 模式：main（主导航）或 sub（子页面返回按钮）
  window.VBNav = {
    init: function (options) {
      options = options || {};
      injectStyles();
      injectViewTransition();

      if (options.mode === 'sub') {
        // 子页面模式：只渲染返回按钮
        var mount = document.getElementById('vb-nav-mount') || document.body;
        mount.insertAdjacentHTML('afterbegin', buildSubBackHTML(options.backHref, options.backLabel));
        return;
      }

      // 主导航模式
      var mount = document.getElementById('vb-nav-mount');
      if (!mount) {
        // 如果没有 mount 点，创建一个并插入到 body 最前面
        mount = document.createElement('div');
        mount.id = 'vb-nav-mount';
        document.body.insertBefore(mount, document.body.firstChild);
      }

      // 获取用户状态：优先从 localStorage 读取缓存，避免异步 auth 导致的 CREATE/头像闪烁
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

  // 自动初始化（DOM 就绪后）
  // 页面可通过 window.VBNavConfig 设置初始化参数
  // 子页面：window.VBNavConfig = { mode: 'sub', backHref: './gallery', backLabel: 'BACK' };
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