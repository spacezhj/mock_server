import jsonServer from 'json-server';
import dotenv from 'dotenv';
import day from "dayjs";

/**
 * 加载环境变量配置文件
 */
dotenv.config();

let router = jsonServer.router(process.env.DB_PATH || 'config/db.json');
let lastDbKeys = Object.keys(router.db.getState());
let middleware = null;

/**
 * 重新创建router实例，用于在数据库结构发生变化时更新路由
 */
export function recreateRouter() {
  router = jsonServer.router(process.env.DB_PATH || 'config/db.json');
  lastDbKeys = Object.keys(router.db.getState());
  // 重新创建中间件
  middleware = null;
}

/**
 * 获取当前的中间件实例，如果不存在则使用默认router
 * @returns {Object} 中间件对象
 */
function getMiddleware() {
  if (!middleware) {
    middleware = router;
  }
  return middleware;
}

/**
 * 主要的Express应用中间件配置函数
 * @param {Object} app - Express应用实例
 */
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

    // 保存原始的json方法
    const originalJson = res.json;
    const originalJsonp = res.jsonp;

    // 保存当前请求的查询参数和方法 转换一下参数，page和pageSize也可以
    //把page和pageSize转换成_limit和_page
    req.query._limit = req.query.pageSize || req.query._limit;
    req.query._page = req.query.page || req.query._page;

    const currentQuery = { ...req.query };
    const currentMethod = req.method;
    const currentStatusCode = res.statusCode;

    // 检查是否是分页请求
    const isPaginated = currentQuery._page || currentQuery._limit;

    // 重写res.json和res.jsonp方法以包装响应数据
    res.json = function(data) {
      const wrappedData = wrapResponse(data, currentQuery, currentMethod, currentStatusCode, res, isPaginated);
      return originalJson.call(this, wrappedData);
    };

    res.jsonp = function(data) {
      const wrappedData = wrapResponse(data, currentQuery, currentMethod, currentStatusCode, res, isPaginated);
      return originalJsonp.call(this, wrappedData);
    };

    // 使用当前的中间件处理请求
    getMiddleware()(req, res, next);
  });
};

/**
 * 包装API响应数据，统一响应格式并处理分页逻辑
 * @param {any} data - 原始响应数据
 * @param {Object} query - 请求查询参数
 * @param {string} method - HTTP请求方法
 * @param {number} statusCode - HTTP状态码
 * @param {Object} res - Express响应对象
 * @param {boolean} isPaginated - 是否为分页请求
 * @returns {Object} 包装后的响应数据
 */
function wrapResponse(data, query, method, statusCode, res, isPaginated) {
  if (isPaginated && Array.isArray(data)) {
    // 处理分页数据
    const page = parseInt(query._page) || 1;
    const limit = parseInt(query._limit) || 10;
    const total = res.get('X-Total-Count') ? parseInt(res.get('X-Total-Count')) : data.length;
    const totalPages = Math.ceil(total / limit);

    return {
      code: statusCode || 200,
      message:  getSuccessMessage(method, statusCode),
      data: data,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: day().format('YYYY-MM-DD HH:mm:ss')
    };
  } else if (!isPaginated) {
    // 非分页请求的常规包装
    return {
      code: statusCode || 200,
      message: getSuccessMessage(method, statusCode),
      data: data,
      timestamp: day().format('YYYY-MM-DD HH:mm:ss')
    };
  }

  // 如果既不是分页也不是需要包装的情况，直接返回原数据
  return data;
}

/**
 * 根据HTTP方法和状态码获取相应的成功消息
 * @param {string} method - HTTP请求方法
 * @param {number} statusCode - HTTP状态码
 * @returns {string} 成功消息文本
 */
function getSuccessMessage(method, statusCode) {
  const messages = {
    'GET': '获取数据成功',
    'POST': '创建数据成功',
    'PUT': '更新数据成功',
    'PATCH': '更新数据成功',
    'DELETE': '删除数据成功'
  };

  if (statusCode === 201) return '创建数据成功';
  if (statusCode === 204) return '删除数据成功';

  return messages[method] || '操作成功';
}

/**
 * 导出router供其他模块使用
 */
export { router };
