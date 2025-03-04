import { User } from "@prisma/client";

declare module "hono" {
    interface HonoRequest {
        user?: Omit<User, 'password'>;
    }
}