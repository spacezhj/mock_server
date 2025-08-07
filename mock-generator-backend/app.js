import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

// 加载环境变量
dotenv.config();

// 获取当前文件的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建express应用用于处理API和其他路由
const app = express();

// 配置中间件
app.use(cors());
app.use(express.json());

// 提供前端打包后的静态文件服务
const staticPath = path.join(__dirname, process.env.FRONTEND_DIST_PATH || '../mock-generator-frontend-v3/dist');
app.use(express.static(staticPath));

// 配置API路由
app.use('/api', apiRoutes);

// 对于SPA应用，将所有非API、非mock路由都指向index.html
app.get(/^\/(?!api|mock).*$/, (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// 处理404错误
app.use((req, res) => {
  res.status(404).json({ error: '请求地址不存在' });
});

// 处理500错误
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务异常!' });
});

export default app;
