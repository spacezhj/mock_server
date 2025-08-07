import api from './api'

/**
 * 获取Schema列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export const getSchemas = (params = {}) => {
  return api.get('/schemas', { params })
}

/**
 * 获取Schema详情
 * @param {string} id - Schema ID
 * @returns {Promise}
 */
export const getSchemaById = (id) => {
  return api.get(`/schemas/${id}`)
}

/**
 * 创建Schema
 * @param {Object} data - Schema数据
 * @returns {Promise}
 */
export const createSchema = (data) => {
  return api.post('/schemas', data)
}

/**
 * 更新Schema
 * @param {string} id - Schema ID
 * @param {Object} data - 更新的Schema数据
 * @returns {Promise}
 */
export const updateSchema = (id, data) => {
  return api.put(`/schemas/${id}`, data)
}

/**
 * 删除Schema
 * @param {string} id - Schema ID
 * @returns {Promise}
 */
export const deleteSchema = (id) => {
  return api.delete(`/schemas/${id}`)
}

/**
 * 获取Schema生成的数据
 * @param {string} id - Schema ID
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export const getSchemaData = (id, params = {}) => {
  return api.get(`/schemas/${id}/data`, { params })
}