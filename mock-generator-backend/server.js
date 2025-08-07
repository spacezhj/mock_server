import dotenv from 'dotenv';
import jsonServerApp from './middleware/jsonServerApp.js';
import expressApp from './app.js';

// 加载环境变量
dotenv.config();

const PORT = process.env.PORT || 3000;

// 将express应用挂载到json-server应用上
jsonServerApp.use(expressApp);

jsonServerApp.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Mock API available at http://localhost:${PORT}/mock`);
  console.log(`Main API available at http://localhost:${PORT}/api`);
});
