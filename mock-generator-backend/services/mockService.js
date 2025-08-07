import Mock from 'mockjs';

class MockService {
  generate(schema, count) {
    // 转换schema为Mock.js模板
    const template = {
      id:"@guid",
      ...this._generateTemplate(schema)
    };


    // 生成指定数量的数据
    return Mock.mock({
      [`list|${count}`]: [template]
    }).list;
  }

  // 专门用于生成嵌套对象模板的辅助方法
  _generateTemplate(schema) {
    const template = {};

    Object.keys(schema).forEach(key => {
      const rule = schema[key];
      if (typeof rule === 'object' && !Array.isArray(rule) && rule !== null) {
        template[key] = this._generateTemplate(rule);
      } else if (Array.isArray(rule)) {
        // 处理数组类型
        template[key] = this._generateArrayTemplate(rule);
      } else {
        template[key] = rule;
      }
    });

    return template;
  }

  // 专门用于生成数组模板的辅助方法
  _generateArrayTemplate(schemaArray) {
    if (schemaArray.length === 0) {
      return [];
    }

    // 数组第一个元素定义了数组内元素的结构
    const elementSchema = schemaArray[0];

    if (typeof elementSchema === 'object' && !Array.isArray(elementSchema) && elementSchema !== null) {
      // 数组元素是对象类型
      return [this._generateTemplate(elementSchema)];
    } else if (Array.isArray(elementSchema)) {
      // 数组元素还是数组类型（二维数组）
      return [this._generateArrayTemplate(elementSchema)];
    } else {
      // 数组元素是基本类型
      return [elementSchema];
    }
  }
}

export default new MockService();
