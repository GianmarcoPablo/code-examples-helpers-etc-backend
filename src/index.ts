import { AppRoutes } from './routes'
import { Server } from './server/server'

(() => {
  main()
})()


async function main() {

  const options = {
    port: 5000,
    routes: AppRoutes.routes
  }

  new Server(options).start()
}