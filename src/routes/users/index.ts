import { Hono } from "hono";
import { prisma } from "../../lib";
import { HashPasswordService } from "../../lib/hash-password";
import { TokenService } from "../../lib/jwt";
import { zValidator } from "@hono/zod-validator"
import { z } from "zod";
export class UsersRoutes {


    static get routes(): Hono {

        const router = new Hono();


        router.post("/register",
            zValidator("json", z.object({
                name: z.string().min(3).max(50),
                email: z.string().email(),
                password: z.string().min(6).max(50),
            })),
            async (c) => {
                const data = c.req.valid('json')
                const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
                if (existingUser) return c.json({ message: "User already exists" }, 400)
                const hashedPassword = await HashPasswordService.hash(data.password)
                const user = await prisma.user.create({
                    data: {
                        name: data.name,
                        email: data.email,
                        password: hashedPassword,
                    }
                })

                const token = await TokenService.generateToken({ id: user.id, exp: 7 * 24 * 60 * 6 })
                return c.json(token)
            });


        router.post('/login', zValidator("json", z.object({
            email: z.string().email(),
            password: z.string().min(6).max(50),
        })),
            async (c) => {
                const data = c.req.valid('json')
                const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
                if (!existingUser) return c.json({ message: "User not found" }, 400)
                const isPasswordValid = await HashPasswordService.compare(data.password, existingUser.password)
                if (!isPasswordValid) return c.json({ message: "Invalid password" }, 400)
                const token = await TokenService.generateToken({ id: existingUser.id, exp: 7 * 24 * 60 * 6 })
                return c.json(token)
            })

        return router
    }

}