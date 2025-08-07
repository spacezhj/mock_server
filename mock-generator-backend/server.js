
// 导入app实例
import app from './app.js';

const PORT = process.env.PORT || 3000;

// 添加未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

// 添加未处理的Promise拒绝处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

// 启动服务器并添加错误处理
const server = app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 服务器错误处理
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用`);
  } else {
    console.error('服务器启动错误:', err);
  }
});

// 导出服务器实例供测试使用
export default server;