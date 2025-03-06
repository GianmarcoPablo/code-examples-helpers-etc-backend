import { Hono } from "hono";
import { UsersRoutes } from "./users";
import { CompanyRoutes } from "./company";

export class AppRoutes {

    static get routes() {

        const router = new Hono()

        router.route('/users', UsersRoutes.routes)
        router.route("/company", CompanyRoutes.routes)

        return router
    }

}