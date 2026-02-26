import express from 'express'
import adminRoutes from '../modules/admin/admin.route'
import fileRoutes from '../modules/file/file.route'
import folderRoutes from '../modules/folder/folder.route'
import packageRoutes from '../modules/package/package.route'
import subscriptionRoutes from '../modules/subscription/subscription.route'
import userRoutes from '../modules/user/user.route'

const router = express.Router()

const moduleRoutes = [
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/packages',
    route: packageRoutes,
  },
  {
    path: '/subscriptions',
    route: subscriptionRoutes,
  },
  {
    path: '/folders',
    route: folderRoutes,
  },
  {
    path: '/files',
    route: fileRoutes,
  },
  {
    path: '/admin',
    route: adminRoutes,
  },
]

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route)
})

export default router
