// ============================================================
// auth.js - 用户认证系统（Supabase Auth）
// 使用方式：在 HTML 中引入 <script src="./auth.js"></script>
// ============================================================

const SUPABASE_URL = 'https://ndktjtrjczajihvntdqa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2pgbXc5YKKiTIOcHv0x3fg_BdLRMMNU';

// ==================== Supabase Auth REST API 封装 ====================
// 由于静态 HTML 无法使用 npm 包，直接通过 REST API 调用

const AUTH_BASE = `${SUPABASE_URL}/auth/v1`;

let currentUser = null; // 当前登录用户
let authReady = false;   // Auth 是否已初始化

// 检查本地存储中的 session
async function checkSession() {
  try {
    const accessToken = localStorage.getItem('vb_access_token');
    const refreshToken = localStorage.getItem('vb_refresh_token');

    if (!accessToken || !refreshToken) {
      currentUser = null;
      authReady = true;
      onAuthStateChange(currentUser);
      return null;
    }

    // 获取用户信息
    const res = await fetch(`${AUTH_BASE}/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (res.ok) {
      const user = await res.json();
      currentUser = {
        id: user.id,
        email: user.email,
        nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || '用户',
        avatar: user.user_metadata?.avatar_url || '',
        provider: user.app_metadata?.provider || 'email'
      };
      localStorage.setItem('vb_user', JSON.stringify(currentUser));
      onAuthStateChange(currentUser);
    } else {
      // Token 过期，尝试刷新
      const refreshed = await refreshSession(refreshToken);
      if (!refreshed) {
        clearSession();
      }
    }
  } catch (e) {
    console.error('[Auth] Session check failed:', e);
    clearSession();
  }

  authReady = true;
  return currentUser;
}

// 刷新 token
async function refreshSession(refreshToken) {
  try {
    const res = await fetch(`${AUTH_BASE}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('vb_access_token', data.access_token);
      localStorage.setItem('vb_refresh_token', data.refresh_token);

      // 重新获取用户信息
      const userRes = await fetch(`${AUTH_BASE}/user`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${data.access_token}`
        }
      });

      if (userRes.ok) {
        const user = await userRes.json();
        currentUser = {
          id: user.id,
          email: user.email,
          nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || '用户',
          avatar: user.user_metadata?.avatar_url || '',
          provider: user.app_metadata?.provider || 'email'
        };
        localStorage.setItem('vb_user', JSON.stringify(currentUser));
        onAuthStateChange(currentUser);
      }
      return true;
    }
  } catch (e) {
    console.error('[Auth] Token refresh failed:', e);
  }
  return false;
}

// 清除 session
function clearSession() {
  localStorage.removeItem('vb_access_token');
  localStorage.removeItem('vb_refresh_token');
  localStorage.removeItem('vb_user');
  currentUser = null;
  onAuthStateChange(null);
}

// 获取当前 access token
function getAccessToken() {
  return localStorage.getItem('vb_access_token');
}

// ==================== 登录/注册方法 ====================

// 邮箱密码注册
async function signUpWithEmail(email, password) {
  const res = await fetch(`${AUTH_BASE}/signup`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      options: {
        data: { nickname: email.split('@')[0] }
      }
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.msg || data.error_description || '注册失败' };
  }

  // 注册成功，保存 session
  if (data.access_token) {
    localStorage.setItem('vb_access_token', data.access_token);
    localStorage.setItem('vb_refresh_token', data.refresh_token);
    currentUser = {
      id: data.user.id,
      email: data.user.email,
      nickname: data.user.user_metadata?.nickname || data.user.email.split('@')[0],
      avatar: '',
      provider: 'email'
    };
    localStorage.setItem('vb_user', JSON.stringify(currentUser));
    onAuthStateChange(currentUser);
  }

  return { success: true, message: data.confirmation_sent_at ? '请查看邮箱确认注册' : '注册成功' };
}

// 邮箱密码登录
async function signInWithEmail(email, password) {
  const res = await fetch(`${AUTH_BASE}/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.msg || data.error_description || '登录失败' };
  }

  localStorage.setItem('vb_access_token', data.access_token);
  localStorage.setItem('vb_refresh_token', data.refresh_token);
  currentUser = {
    id: data.user.id,
    email: data.user.email,
    nickname: data.user.user_metadata?.nickname || data.user.email.split('@')[0],
    avatar: '',
    provider: 'email'
  };
  localStorage.setItem('vb_user', JSON.stringify(currentUser));
  onAuthStateChange(currentUser);
  return { success: true };
}

// GitHub OAuth 登录
function signInWithGitHub() {
  const redirectUrl = encodeURIComponent(window.location.origin + window.location.pathname);
  const url = `${AUTH_BASE}/authorize?provider=github&redirect_to=${redirectUrl}`;
  window.location.href = url;
}

// 退出登录
async function signOut() {
  const refreshToken = localStorage.getItem('vb_refresh_token');
  if (refreshToken) {
    try {
      await fetch(`${AUTH_BASE}/logout`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
    } catch (e) {
      console.error('[Auth] Logout error:', e);
    }
  }
  clearSession();
  hideAuthModal();
}

// ==================== Auth 状态回调 ====================
// 可在页面中覆盖此函数
function onAuthStateChange(user) {
  updateAuthUI(user);
}

// ==================== 登录弹窗 UI ====================

function showAuthModal(mode) {
  const existing = document.getElementById('authModal');
  if (existing) {
    existing.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'authModal';
  modal.innerHTML = `
    <div class="auth-overlay" id="authOverlay"></div>
    <div class="auth-modal">
      <button class="auth-close" id="authClose">&times;</button>

      <div class="auth-header">
        <h2 id="authTitle">${mode === 'login' ? '登录' : '注册'}</h2>
        <p class="auth-subtitle" id="authSubtitle">${mode === 'login' ? '登录后即可收藏和评论灵感' : '创建账号，加入 Vibe Bubble'}</p>
      </div>

      <!-- GitHub 登录按钮 -->
      <button class="auth-btn auth-btn-github" id="authGithubBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        使用 GitHub ${mode === 'login' ? '登录' : '注册'}
      </button>

      <div class="auth-divider">
        <span>或</span>
      </div>

      <!-- 邮箱密码表单 -->
      <form id="authForm" class="auth-form">
        <div class="auth-field">
          <label for="authEmail">邮箱</label>
          <input type="email" id="authEmail" placeholder="your@email.com" required autocomplete="email">
        </div>
        <div class="auth-field">
          <label for="authPassword">密码</label>
          <input type="password" id="authPassword" placeholder="${mode === 'login' ? '输入密码' : '至少8位，包含大小写和数字'}" required minlength="8" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}">
        </div>
        <div class="auth-error" id="authError" style="display:none"></div>
        <button type="submit" class="auth-btn auth-btn-primary" id="authSubmitBtn">
          ${mode === 'login' ? '登录' : '注册'}
        </button>
      </form>

      <div class="auth-switch">
        <span id="authSwitchText">${mode === 'login' ? '还没有账号？' : '已有账号？'}</span>
        <a href="#" id="authSwitchLink">${mode === 'login' ? '立即注册' : '去登录'}</a>
      </div>
    </div>
  `;

  // 注入样式（仅首次）
  if (!document.getElementById('authStyles')) {
    const style = document.createElement('style');
    style.id = 'authStyles';
    style.textContent = `
      .auth-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.6);
        backdrop-filter: blur(8px); z-index: 9998;
        animation: authFadeIn 0.2s ease;
      }
      .auth-modal {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 90%; max-width: 400px; background: rgba(15,15,30,0.95);
        border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
        padding: 32px 28px; z-index: 9999;
        box-shadow: 0 24px 80px rgba(0,0,0,0.5);
        animation: authSlideIn 0.3s ease;
      }
      .auth-close {
        position: absolute; top: 12px; right: 16px;
        background: none; border: none; color: #94a3b8;
        font-size: 24px; cursor: pointer; padding: 4px 8px;
        transition: color 0.2s;
      }
      .auth-close:hover { color: #f8fafc; }
      .auth-header { text-align: center; margin-bottom: 24px; }
      .auth-header h2 { color: #f8fafc; font-size: 22px; margin-bottom: 6px; }
      .auth-subtitle { color: #94a3b8; font-size: 14px; }
      .auth-btn {
        display: flex; align-items: center; justify-content: center; gap: 10px;
        width: 100%; padding: 12px 16px; border-radius: 12px;
        font-size: 15px; font-weight: 500; cursor: pointer;
        transition: all 0.2s; border: none;
      }
      .auth-btn-github {
        background: #fff; color: #0d1117;
      }
      .auth-btn-github:hover { background: #e6e6e6; transform: translateY(-1px); }
      .auth-btn-primary {
        background: linear-gradient(135deg, #a855f7, #6366f1); color: #fff;
      }
      .auth-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
      .auth-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .auth-divider {
        display: flex; align-items: center; gap: 12px;
        margin: 20px 0; color: #64748b; font-size: 13px;
      }
      .auth-divider::before, .auth-divider::after {
        content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08);
      }
      .auth-form { display: flex; flex-direction: column; gap: 14px; }
      .auth-field label {
        display: block; color: #94a3b8; font-size: 13px; margin-bottom: 6px;
      }
      .auth-field input {
        width: 100%; padding: 10px 14px; border-radius: 10px;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
        color: #f8fafc; font-size: 14px; outline: none;
        transition: border-color 0.2s;
      }
      .auth-field input:focus { border-color: #a855f7; }
      .auth-field input::placeholder { color: #475569; }
      .auth-error {
        background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
        border-radius: 10px; padding: 10px 14px; color: #fca5a5;
        font-size: 13px; text-align: center;
      }
      .auth-switch {
        text-align: center; margin-top: 20px; font-size: 13px; color: #64748b;
      }
      .auth-switch a {
        color: #a855f7; text-decoration: none; margin-left: 4px;
      }
      .auth-switch a:hover { text-decoration: underline; }
      @keyframes authFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes authSlideIn { from { opacity: 0; transform: translate(-50%, -48%); } to { opacity: 1; transform: translate(-50%, -50%); } }

      /* 导航栏用户状态 */
      .auth-user-btn {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 14px; border-radius: 20px;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
        color: #f8fafc; font-size: 13px; cursor: pointer;
        transition: all 0.2s;
      }
      .auth-user-btn:hover { background: rgba(255,255,255,0.1); }
      .auth-user-btn .auth-avatar {
        width: 24px; height: 24px; border-radius: 50%;
        background: linear-gradient(135deg, #a855f7, #6366f1);
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 600; color: #fff;
      }
      .auth-login-btn {
        padding: 6px 16px; border-radius: 20px;
        background: linear-gradient(135deg, #a855f7, #6366f1);
        border: none; color: #fff; font-size: 13px;
        font-weight: 500; cursor: pointer; transition: all 0.2s;
      }
      .auth-login-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      .auth-user-menu {
        position: absolute; top: 100%; right: 0; margin-top: 8px;
        background: rgba(15,15,30,0.95); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px; padding: 6px; min-width: 140px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 1000;
      }
      .auth-user-menu-item {
        display: block; width: 100%; padding: 8px 12px;
        border: none; background: none; color: #94a3b8;
        font-size: 13px; text-align: left; cursor: pointer;
        border-radius: 8px; transition: all 0.15s;
      }
      .auth-user-menu-item:hover { background: rgba(255,255,255,0.06); color: #f8fafc; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  // 绑定事件
  let currentMode = mode;

  document.getElementById('authOverlay').addEventListener('click', hideAuthModal);
  document.getElementById('authClose').addEventListener('click', hideAuthModal);
  document.getElementById('authGithubBtn').addEventListener('click', () => {
    signInWithGitHub();
  });

  document.getElementById('authSwitchLink').addEventListener('click', (e) => {
    e.preventDefault();
    hideAuthModal();
    setTimeout(() => showAuthModal(currentMode === 'login' ? 'register' : 'login'), 200);
  });

  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const errorEl = document.getElementById('authError');
    const submitBtn = document.getElementById('authSubmitBtn');

    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = currentMode === 'login' ? '登录中...' : '注册中...';

    let result;
    if (currentMode === 'login') {
      result = await signInWithEmail(email, password);
    } else {
      result = await signUpWithEmail(email, password);
    }

    if (result.error) {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = currentMode === 'login' ? '登录' : '注册';
    } else {
      if (result.message) {
        // 需要邮箱确认
        errorEl.style.display = 'none';
        document.getElementById('authTitle').textContent = '请确认邮箱';
        document.getElementById('authSubtitle').textContent = result.message;
        document.getElementById('authForm').style.display = 'none';
        document.getElementById('authGithubBtn').style.display = 'none';
        document.getElementById('authDivider').style.display = 'none';
        document.getElementById('authSwitchText').textContent = '';
        document.getElementById('authSwitchLink').textContent = '关闭';
        document.getElementById('authSwitchLink').addEventListener('click', (e) => {
          e.preventDefault();
          hideAuthModal();
        });
      } else {
        hideAuthModal();
      }
    }
  });
}

function hideAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 200);
  }
}

// ==================== 更新页面 Auth UI ====================

function updateAuthUI(user) {
  // 在导航栏更新用户状态（可在各页面中自定义）
  const authContainer = document.getElementById('authContainer');
  if (!authContainer) return;

  if (user) {
    const initials = (user.nickname || 'U').charAt(0).toUpperCase();
    authContainer.innerHTML = `
      <div class="auth-user-wrapper" style="position:relative">
        <div class="auth-user-btn" id="authUserBtn">
          <div class="auth-avatar">${initials}</div>
          <span>${user.nickname}</span>
        </div>
        <div class="auth-user-menu" id="authUserMenu" style="display:none">
          <a href="./profile.html" class="auth-user-menu-item" style="text-decoration:none;display:block;">&#x1F464; 个人中心</a>
          <button class="auth-user-menu-item" id="authLogoutBtn">&#x2192; 退出登录</button>
        </div>
      </div>
    `;

    document.getElementById('authUserBtn').addEventListener('click', () => {
      const menu = document.getElementById('authUserMenu');
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('authLogoutBtn').addEventListener('click', () => {
      signOut();
    });

    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
      const wrapper = document.querySelector('.auth-user-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById('authUserMenu').style.display = 'none';
      }
    });
  } else {
    authContainer.innerHTML = `<button class="auth-login-btn" id="authLoginBtn">登录</button>`;
    document.getElementById('authLoginBtn').addEventListener('click', () => {
      showAuthModal('login');
    });
  }
}

// ==================== 初始化（自动检查 session + 处理 OAuth 回调） ====================

(async function initAuth() {
  // 检查 URL 中是否有 OAuth 回调的 hash
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    // GitHub OAuth 回调
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      localStorage.setItem('vb_access_token', accessToken);
      localStorage.setItem('vb_refresh_token', refreshToken);
      window.location.hash = ''; // 清除 hash
      await checkSession();
      return;
    }
  }

  // 正常检查 session
  await checkSession();
})();

// 暴露到全局（供页面其他 JS 调用）
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.signOut = signOut;
window.currentUser = () => currentUser;
window.getAccessToken = getAccessToken;
window.requireAuth = function() {
  if (currentUser) return true;
  showAuthModal('login');
  return false;
};

// ==================== 收藏功能 API ====================

/**
 * 检查用户是否已收藏某个灵感
 */
async function isFavorited(inspirationId) {
  const token = getAccessToken();
  if (!token || !currentUser) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/favorites?inspiration_id=eq.${inspirationId}&user_id=eq.${currentUser.id}&select=id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      return data.length > 0;
    }
  } catch (e) {
    console.error('[Favorites] Check error:', e);
  }
  return false;
}

/**
 * 添加收藏
 */
async function addFavorite(inspirationId) {
  const token = getAccessToken();
  if (!token || !currentUser) return { error: '未登录' };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/favorites`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: currentUser.id,
        inspiration_id: inspirationId
      })
    });

    if (res.ok || res.status === 201) {
      return { success: true };
    } else {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || '收藏失败' };
    }
  } catch (e) {
    console.error('[Favorites] Add error:', e);
    return { error: '网络错误' };
  }
}

/**
 * 取消收藏
 */
async function removeFavorite(inspirationId) {
  const token = getAccessToken();
  if (!token || !currentUser) return { error: '未登录' };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/favorites?inspiration_id=eq.${inspirationId}&user_id=eq.${currentUser.id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      return { success: true };
    } else {
      return { error: '取消收藏失败' };
    }
  } catch (e) {
    console.error('[Favorites] Remove error:', e);
    return { error: '网络错误' };
  }
}

/**
 * 切换收藏状态
 */
async function toggleFavorite(inspirationId) {
  if (!requireAuth()) return null;

  const favorited = await isFavorited(inspirationId);

  if (favorited) {
    return await removeFavorite(inspirationId);
  } else {
    return await addFavorite(inspirationId);
  }
}

// 暴露收藏函数到全局
window.isFavorited = isFavorited;
window.toggleFavorite = toggleFavorite;

// ==================== 评分功能 API ====================

/**
 * 获取某个灵感的评分统计
 */
async function getRatingStats(inspirationId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ratings?inspiration_id=eq.${inspirationId}&select=rating`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });

    if (res.ok) {
      const data = await res.json();
      const count = data.length;
      const average = count > 0
        ? data.reduce((sum, item) => sum + (item.rating || 0), 0) / count
        : 0;
      return {
        count,
        average: Math.round(average * 10) / 10 // 保留1位小数
      };
    }
  } catch (e) {
    console.error('[Ratings] Stats error:', e);
  }
  return { count: 0, average: 0 };
}

/**
 * 获取当前用户对某个灵感的评分
 */
async function getUserRating(inspirationId) {
  const token = getAccessToken();
  if (!token || !currentUser) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ratings?inspiration_id=eq.${inspirationId}&user_id=eq.${currentUser.id}&select=rating`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      return data.length > 0 ? data[0].rating : null;
    }
  } catch (e) {
    console.error('[Ratings] User rating error:', e);
  }
  return null;
}

/**
 * 提交评分
 */
async function submitRating(inspirationId, rating) {
  const token = getAccessToken();
  if (!token || !currentUser) return { error: '未登录' };

  if (rating < 1 || rating > 5) {
    return { error: '评分范围为1-5分' };
  }

  try {
    // 先检查是否已有评分
    const existing = await getUserRating(inspirationId);

    if (existing !== null) {
      // 更新评分
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ratings?inspiration_id=eq.${inspirationId}&user_id=eq.${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ rating })
      });

      if (res.ok) {
        return { success: true, updated: true };
      } else {
        const err = await res.json().catch(() => ({}));
        return { error: err.message || '评分更新失败' };
      }
    } else {
      // 新建评分
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ratings`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          inspiration_id: inspirationId,
          rating
        })
      });

      if (res.ok || res.status === 201) {
        return { success: true, created: true };
      } else {
        const err = await res.json().catch(() => ({}));
        return { error: err.message || '评分失败' };
      }
    }
  } catch (e) {
    console.error('[Ratings] Submit error:', e);
    return { error: '网络错误' };
  }
}

// 暴露评分函数到全局
window.getRatingStats = getRatingStats;
window.getUserRating = getUserRating;
window.submitRating = submitRating;

// ==================== 个人中心 API ====================

/**
 * 获取用户收藏的灵感列表
 */
async function getUserFavorites(userId) {
  const token = getAccessToken();
  if (!token || !userId) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&select=inspiration_id,inspirations(id,title,summary,tags,cover_image_url,source_platform,author_name,status,created_at)&order=updated_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (res.ok) {
      const data = await res.json();
      // 提取灵感数据，过滤掉已删除或被隐藏的
      return data
        .map((item) => item.inspirations)
        .filter((insp) => insp && insp.status !== 'deleted');
    }
  } catch (e) {
    console.error('[Profile] Get favorites error:', e);
  }
  return [];
}

/**
 * 获取用户统计信息（收藏数、评分数）
 */
async function getUserStats(userId) {
  const token = getAccessToken();
  if (!token || !userId) return { favorites: 0, ratings: 0 };

  try {
    const [favRes, ratingRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&select=id`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/ratings?user_id=eq.${userId}&select=id`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      })
    ]);

    const favorites = favRes.ok ? (await favRes.json()).length : 0;
    const ratings = ratingRes.ok ? (await ratingRes.json()).length : 0;

    return { favorites, ratings };
  } catch (e) {
    console.error('[Profile] Get stats error:', e);
  }
  return { favorites: 0, ratings: 0 };
}

/**
 * 更新用户昵称
 */
async function updateNickname(newNickname) {
  const token = getAccessToken();
  if (!token || !currentUser) return { error: '未登录' };

  if (!newNickname || newNickname.trim().length === 0) {
    return { error: '昵称不能为空' };
  }

  if (newNickname.trim().length > 20) {
    return { error: '昵称不能超过20个字符' };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: { nickname: newNickname.trim() }
      })
    });

    if (res.ok) {
      const user = await res.json();
      // 更新本地缓存
      currentUser = {
        ...currentUser,
        nickname: newNickname.trim()
      };
      localStorage.setItem('vb_user', JSON.stringify(currentUser));
      onAuthStateChange(currentUser);
      return { success: true };
    } else {
      const err = await res.json().catch(() => ({}));
      return { error: err.msg || err.error_description || '更新失败' };
    }
  } catch (e) {
    console.error('[Profile] Update nickname error:', e);
    return { error: '网络错误' };
  }
}

// 暴露个人中心函数到全局
window.getUserFavorites = getUserFavorites;
window.getUserStats = getUserStats;
window.updateNickname = updateNickname;

// ==================== Ideas API（用户灵感记录）====================

/**
 * 保存用户灵感
 */
async function saveIdea(title, tags) {
  const token = getAccessToken();
  if (!token || !currentUser) return { error: '未登录' };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/ideas`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: currentUser.id,
        title: title,
        tags: tags || [],
        status: 'basic_cognition'
      })
    });

    if (res.ok || res.status === 201) {
      const data = await res.json();
      return { success: true, data: data[0] };
    } else {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || '保存失败' };
    }
  } catch (e) {
    console.error('[Ideas] Save error:', e);
    return { error: '网络错误' };
  }
}

/**
 * 获取用户灵感列表
 */
async function getUserIdeas(userId) {
  const token = getAccessToken();
  if (!token || !userId) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ideas?user_id=eq.${userId}&order=updated_at.desc&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error('[Ideas] Get list error:', e);
  }
  return [];
}

/**
 * 删除用户灵感
 */
async function deleteIdea(ideaId) {
  const token = getAccessToken();
  if (!token || !currentUser) return { error: '未登录' };

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ideas?id=eq.${ideaId}&user_id=eq.${currentUser.id}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (res.ok) {
      return { success: true };
    }
    return { error: '删除失败' };
  } catch (e) {
    console.error('[Ideas] Delete error:', e);
    return { error: '网络错误' };
  }
}

/**
 * 更新灵感状态
 */
async function updateIdeaStatus(ideaId, status) {
  const token = getAccessToken();
  if (!token || !currentUser) return { error: '未登录' };

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ideas?id=eq.${ideaId}&user_id=eq.${currentUser.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status })
      }
    );

    if (res.ok) {
      return { success: true };
    }
    return { error: '更新失败' };
  } catch (e) {
    console.error('[Ideas] Update error:', e);
    return { error: '网络错误' };
  }
}

/**
 * 获取用户灵感数量
 */
async function getUserIdeaCount(userId) {
  const token = getAccessToken();
  if (!token || !userId) return 0;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/ideas?user_id=eq.${userId}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'count=exact'
        }
      }
    );

    if (res.ok) {
      const count = res.headers.get('content-range');
      if (count) {
        const parts = count.split('/');
        return parseInt(parts[1]) || 0;
      }
      const data = await res.json();
      return data.length;
    }
  } catch (e) {
    console.error('[Ideas] Count error:', e);
  }
  return 0;
}


// ==================== Idea Outputs API（阶段核心产出）====================

/**
 * 获取某个灵感某阶段的核心产出
 */
async function getIdeaOutput(ideaId, stage) {
  const token = getAccessToken();
  if (!token || !ideaId) return null;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/idea_outputs?idea_id=eq.${ideaId}&stage=eq.${stage}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.length > 0 ? data[0] : null;
    }
  } catch (e) {
    console.error('[IdeaOutputs] Get error:', e);
  }
  return null;
}

/**
 * 保存（upsert）某个灵感某阶段的核心产出
 */
async function saveIdeaOutput(ideaId, stage, content, templateType) {
  const token = getAccessToken();
  if (!token || !currentUser) return { error: '未登录' };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/idea_outputs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        idea_id: ideaId,
        stage: stage,
        content: content,
        template_type: templateType || null
      })
    });

    if (res.ok || res.status === 201) {
      await touchIdeaUpdated(ideaId);
      const data = await res.json();
      return { success: true, data: data[0] };
    } else {
      const err = await res.json().catch(() => ({}));
      return { error: err.message || '保存失败' };
    }
  } catch (e) {
    console.error('[IdeaOutputs] Save error:', e);
    return { error: '网络错误' };
  }
}

/**
 * 更新灵感的 updated_at（触摸时间戳，用于排序）
 */
async function touchIdeaUpdated(ideaId) {
  const token = getAccessToken();
  if (!token || !currentUser) return;

  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/ideas?id=eq.${ideaId}&user_id=eq.${currentUser.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ updated_at: new Date().toISOString() })
      }
    );
  } catch (e) {
    console.error('[Ideas] Touch updated_at error:', e);
  }
}

// 暴露 Ideas API
window.saveIdea = saveIdea;
window.getUserIdeas = getUserIdeas;
window.deleteIdea = deleteIdea;
window.updateIdeaStatus = updateIdeaStatus;
window.getUserIdeaCount = getUserIdeaCount;
window.getIdeaOutput = getIdeaOutput;
window.saveIdeaOutput = saveIdeaOutput;
window.touchIdeaUpdated = touchIdeaUpdated;
