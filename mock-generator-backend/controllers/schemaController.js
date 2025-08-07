import jsonServer from 'json-server';
import mockService from '../services/mockService.js';
import day from 'dayjs';
import dotenv from 'dotenv';
const router =jsonServer.router('config/db.json');

// 加载环境变量
dotenv.config();

// 导入lowdb
import { Low, JSONFileSync } from 'lowdb';
const adapter = new JSONFileSync(process.env.SCHEMAS_PATH || 'config/schemas.json');
const db = new Low(adapter);

// 初始化函数
async function initDb() {
  await db.read();
  if (!db.data) {
    db.data = { schemas: [] };
    await db.write();
  }
  return db;
}

// 创建Schema
export const create = async (req, res) => {
  const { name, resourceName, schema, count } = req.body;

  // 验证输入
  if (!name || !resourceName || !schema || !count) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (count < 1 || count > 100) {
    return res.status(400).json({ error: '数据条数必须在1-100之间' });
  }

  try {
    // 确保数据库已初始化
    const database = await initDb();

    // 检查名称是否重复
    const existingSchema = database.data.schemas.find(item => item.name === name);
    if (existingSchema) {
      return res.status(400).json({ error: 'Schema名称已存在，请使用其他名称' });
    }


    // 生成Mock数据
    const mockData = mockService.generate(schema, count);

    // 更新主数据库
    const currentDb = router.db.getState();
    currentDb[resourceName] = mockData;
    router.db.setState(currentDb);
    await router.db.write();

    // 保存Schema配置
    const newSchema = {
      id: `schema_${Date.now()}`,
      name,
      resourceName,
      schema,
      count,
      createdAt: day().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: day().format('YYYY-MM-DD HH:mm:ss')
    };

    database.data.schemas.push(newSchema);
    await database.write();

    // 重新创建router以确保新资源路由可用
    // recreateRouter();

    res.status(201).json({
      ...newSchema,
      endpoint: `${process.env.API_URL}/${resourceName}`
    });
  } catch (error) {
    console.error('生成数据失败:', error);
    res.status(500).json({ error: '生成数据失败: ' + error.message, stack: error.stack });
  }
};

// 获取所有Schema（带分页）
export const getAll = async (req, res) => {
  try {
    // 获取分页参数，设置默认值
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    // 确保数据库已初始化
    const database = await initDb();
    // 检查是否有分页参数
    const hasPagination = req.query.page || req.query.pageSize;
    const schemas = (database.data.schemas || []).map((t)=>{
      return {
        ...t,
        endpoint: `${process.env.API_URL}/${t.resourceName}`
      }
    })
    if(hasPagination){
      const total = schemas.length;

      // 计算分页索引
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, total);

      // 分页数据
      const paginatedSchemas = schemas.slice(startIndex, endIndex).map(schema => ({
        ...schema,
        createdAt: day(schema.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: day(schema.updatedAt).format('YYYY-MM-DD HH:mm:ss')
      }));

      // 计算总页数
      const totalPages = Math.ceil(total / pageSize);

      res.json({
        data: paginatedSchemas,
        pagination: {
          total,
          page,
          pageSize,
          totalPages
        }
      });
    }else{
      res.json(schemas)
    }

  } catch (error) {
    res.status(500).json({ error: '获取数据失败: ' + error.message });
  }
};

// 获取单个Schema
export const getById = async (req, res) => {
  try {
    // 确保数据库已初始化
    const database = await initDb();

    const schema = database.data.schemas.find(item => item.id === req.params.id);
    if (!schema) {
      return res.status(404).json({ error: 'Schema不存在' });
    }
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: '获取数据失败: ' + error.message });
  }
};

// 更新Schema
export const update = async (req, res) => {
  const { name, resourceName, schema, count } = req.body;

  // 验证输入
  if (!name || !resourceName || !schema || !count) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (count < 1 || count > 1000) {
    return res.status(400).json({ error: '数据条数必须在1-1000之间' });
  }

  try {
    // 确保数据库已初始化
    const database = await initDb();

    // 生成Mock数据
    const mockData = mockService.generate(schema, count);

    // 更新主数据库
    const currentDb = router.db.getState();
    currentDb[resourceName] = mockData;
    router.db.setState(currentDb);
    router.db.write();

    // 更新Schema配置
    const schemaIndex = database.data.schemas.findIndex(item => item.id === req.params.id);
    if (schemaIndex === -1) {
      return res.status(404).json({ error: 'Schema不存在' });
    }
    const updatedSchema = {
      ...database.data.schemas[schemaIndex],
      name,
      resourceName,
      schema,
      count,
      updatedAt: new Date().toISOString()
    };
    database.data.schemas[schemaIndex] = updatedSchema;
    await database.write();

    res.json({
      ...updatedSchema,
      endpoint: `${process.env.API_URL}/${resourceName}`
    });
  } catch (error) {
    res.status(500).json({ error: '更新数据失败: ' + error.message });
  }
};

// 删除Schema
export const deleteSchema = async (req, res) => {
  try {
    // 确保数据库已初始化
    const database = await initDb();

    const schema = database.data.schemas.find(item => item.id === req.params.id);
    if (!schema) {
      return res.status(404).json({ error: 'Schema不存在' });
    }

    // 从主数据库中删除对应资源
    const currentDb = router.db.getState();
    delete currentDb[schema.resourceName];
    router.db.setState(currentDb);
    router.db.write();

    // 从Schema配置中删除
    database.data.schemas = database.data.schemas.filter(item => item.id !== req.params.id);
    await database.write();

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除数据失败: ' + error.message });
  }
};

// 获取Schema对应的数据
export const getData = async (req, res) => {
  try {
    // 确保数据库已初始化
    const database = await initDb();

    const schema = database.data.schemas.find(item => item.id === req.params.id);
    if (!schema) {
      return res.status(404).json({ error: 'Schema不存在' });
    }

    const currentDb = router.db.getState();
    const data = currentDb[schema.resourceName] || [];

    // 检查是否有分页参数
    const hasPagination = req.query.page || req.query.pageSize;

    if (hasPagination) {
      // 获取分页参数
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      // 计算分页索引
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      // 分页数据
      const paginatedData = data.slice(startIndex, endIndex);

      // 计算总页数
      const totalPages = Math.ceil(data.length / pageSize);

      res.json({
        data: paginatedData,
        pagination: {
          total: data.length,
          page,
          pageSize,
          totalPages
        }
      });
    } else {
      // 没有分页参数时返回所有数据
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: '获取数据失败: ' + error.message });
  }
};

export default {
  create,
  getAll,
  getById,
  update,
  deleteSchema,
  getData

}
