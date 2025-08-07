import jsonServer from 'json-server';
import dotenv from 'dotenv';
import jsonServerUse from "./jsonServerUse.js";
import {fileURLToPath} from "url";
import path from "path";

// 加载环境变量
dotenv.config();

// 创建标准的json-server应用
const app = jsonServer.create();

// 手动添加必要的中间件（替代 defaults，但排除静态文件中间件）
app.use(jsonServer.bodyParser);

// // 添加日志中间件（来自 morgan）
// import morgan from 'morgan';
// app.use(morgan('dev'));


// 使用 defaults 中间件，并指定自定义静态文件目录
// 这样就不会显示默认的 json-server 首页了

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultMiddlewares = jsonServer.defaults({
  static: path.join(__dirname, process.env.FRONTEND_DIST_PATH || '../mock-generator-frontend-v3/dist') // 指向自定义的静态文件目录
});

// 应用所有默认中间件
app.use(defaultMiddlewares);

app.use(jsonServer.rewriter({})); // 空的路由重写规则


// 添加CORS支持（如果需要）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// 添加基本的中间件
app.use((req, res, next) => {
  // 添加延迟模拟（可选）
  if (process.env.DELAY) {
    setTimeout(() => next(),process.env.DELAY);
  } else {
    next();
  }
});

//定义中间件
jsonServerUse(app)

// 导出中间件
export default app

// 导出router供其他模块使用
export {jsonServer };
