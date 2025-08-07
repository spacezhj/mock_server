import { createRouter, createWebHistory } from 'vue-router'
import SchemaList from '../pages/SchemaList.vue'
import SchemaForm from '../pages/SchemaForm.vue'
import DataTest from '../pages/DataTest.vue'
import Home from '../pages/Home.vue'

export const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/schemas', name: 'schemaList', component: SchemaList },
  { path: '/schemas/create', name: 'createSchema', component: SchemaForm },
  { path: '/schemas/:id/edit', name: 'editSchema', component: SchemaForm },
  { path: '/data-test', name: 'dataTest', component: DataTest },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router