import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { cors } from 'hono/cors'

export interface Options {
    port?: number
    routes: Hono
}

export class Server {

    public readonly app = new Hono()
    private readonly port: number
    private readonly routes: Hono

    constructor(options: Options) {
        const { port = 8000, routes } = options
        this.port = port
        this.routes = routes
    }


    async start() {


        // Static files
        this.app.use("/static/*", serveStatic({ root: "./" }))

        // use defined routes
        this.app.use(
            '*',
            cors({
                origin: '*',
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', "PATCH", 'OPTIONS'],
            })
        )

        this.app.route('/api/v1', this.routes)


        // Routes - Not found
        this.app.notFound((c) => {
            return c.text('Custom 404 Message', 404)
        })

        // Routes - Error Handler
        this.app.onError((err, c) => {
            console.error(`${err}`)
            return c.text('Custom Error Message', 500)
        })



        const bunServer = Bun.serve({
            port: 8000,
            fetch: this.app.fetch, // Hono's `fetch` method handles requests
            error: (err) => {
                console.error('Server error:', err)
                return new Response('Internal Server Error', { status: 500 })
            },

        })
        console.log(`Server running at ${bunServer.url.host}`);

    }
}