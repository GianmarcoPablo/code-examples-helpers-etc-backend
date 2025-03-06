import { prisma } from "../lib";
import { Next } from "hono";
import { Context } from "hono";
import { decode } from "hono/jwt";
import { JwtTokenInvalid } from "hono/utils/jwt/types";

export class AuthMiddleware {

    public static async isAuth(c: Context, next: Next) {
        try {
            const bearer = c.req.header("Authorization");
            if (!bearer) {
                return c.json({ msg: "Unauthorized: No Authorization header", error: true }, 401);
            }

            const [, token] = bearer.split(" ");
            if (!token) {
                return c.json({ msg: "Unauthorized: No token provided", error: true }, 401);
            }

            try {
                const { payload } = decode(token);
                if (!payload || !payload.id) {
                    return c.json({ msg: "Unauthorized: Invalid token payload" }, 401);
                }

                const user = await prisma.user.findUnique({ where: { id: payload.id as string } });
                if (!user) {
                    return c.json({ msg: "Unauthorized: User not found", error: true }, 401);
                }

                c.req.user = {
                    id: user.id,
                    name: user.name,
                    roles: user.roles,
                    email: user.email,
                    stripeCustomerId: user.stripeCustomerId,
                    stripeSubscriptionId: user.stripeSubscriptionId,
                    stripePriceId: user.stripePriceId,
                    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd
                };

                await next();
            } catch (error) {
                if (error instanceof JwtTokenInvalid) {
                    return c.json({ msg: "Unauthorized: Invalid token format", error: true }, 401);
                }
                throw error; // Maneja otros errores inesperados
            }
        } catch (error) {
            console.error("Authentication error:", error);
            return c.json({ msg: "Internal Server Error: Authentication failed" }, 500);
        }
    }

}