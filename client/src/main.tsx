/**
 * React 应用入口
 * 挂载根组件到 DOM，初始化主题
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initTheme } from './store/useThemeStore';
import './index.css';

// 初始化主题（在应用渲染前执行）
initTheme();

// 获取根DOM节点
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('找不到根元素 #root，请检查 index.html');
}

// 创建React根节点并渲染应用
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
