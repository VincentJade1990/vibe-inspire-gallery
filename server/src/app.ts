/**
 * Express 应用入口
 * 配置中间件、路由、错误处理，启动HTTP服务
 */

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import casesRouter from './routes/cases';

// 创建Express应用实例
const app = express();

// 服务端口号
const PORT = process.env.PORT || 3001;

/**
 * 全局中间件配置
 */

// 启用CORS跨域，允许前端开发服务器访问
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));

// 解析URL编码请求体
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * 健康检查端点
 * 用于确认服务是否正常运行
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Vibe Coding 灵感库后端服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 案例相关路由
 * 挂载到 /api/cases 路径下
 */
app.use('/api/cases', casesRouter);

/**
 * 404 路由处理
 * 当没有任何路由匹配时返回
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '接口不存在，请检查请求路径',
  });
});

/**
 * 全局错误处理中间件
 * 捕获所有未处理的异常
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

/**
 * 启动HTTP服务
 */
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Vibe Coding 灵感库后端服务已启动`);
  console.log(`📡 API 地址: http://localhost:${PORT}/api`);
  console.log(`💚 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`========================================\n`);
});

export default app;
