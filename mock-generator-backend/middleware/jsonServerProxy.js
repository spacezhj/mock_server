import jsonServer from 'json-server';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

let router = jsonServer.router(process.env.DB_PATH || 'config/db.json');
let lastDbKeys = Object.keys(router.db.getState());
let middleware = null;

// 重新创建router的函数
export function recreateRouter() {
  router = jsonServer.router(process.env.DB_PATH || 'config/db.json');
  lastDbKeys = Object.keys(router.db.getState());
  // 重新创建中间件
  middleware = null;
}

// 获取当前的中间件
function getMiddleware() {
  if (!middleware) {
    middleware = router;
  }
  return middleware;
}

export default (app) => {
  // 代理所有/mock/*请求到JSON-Server
  app.use(process.env.API_URL, async (req, res, next) => {
    // 读取最新的数据库状态
    await router.db.read();
    const currentDbKeys = Object.keys(router.db.getState());

    // 检查是否有新的资源被添加
    const hasNewResource = currentDbKeys.some(key => !lastDbKeys.includes(key));

    // 如果有新的资源，重新创建router
    if (hasNewResource) {
      recreateRouter();
      lastDbKeys = currentDbKeys;
    }

    // 使用当前的中间件处理请求
    getMiddleware()(req, res, next);
  });
};

// 导出router供其他模块使用
export { router };
