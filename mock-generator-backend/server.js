import dotenv from 'dotenv';
import jsonServerApp from './middleware/jsonServerApp.js';
import expressApp from './app.js';

// 加载环境变量
dotenv.config();

const PORT = process.env.PORT || 3000;

// 将express应用挂载到json-server应用上
jsonServerApp.use(expressApp);

console.log(process.env.VERCEL)
// 如果不是在 Vercel 环境中，则启动服务器
if (!process.env.VERCEL) {
  jsonServerApp.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Mock API available at http://localhost:${PORT}/mock`);
    console.log(`Main API available at http://localhost:${PORT}/api`);
  });
}
// 导出默认函数供 Vercel 使用
export default jsonServerApp;

