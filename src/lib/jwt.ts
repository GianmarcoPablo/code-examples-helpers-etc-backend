import { JWTPayload } from "hono/utils/jwt/types";
import { sign, verify } from 'hono/jwt'

export class TokenService {

    private static readonly secret: string = "mySecretKey";

    static async generateToken(payload: JWTPayload): Promise<string> {
        const token = await sign(payload, this.secret)
        return token
    }

    static async verifyToken(token: string): Promise<JWTPayload> {
        const decodedPayload = await verify(token, this.secret)
        return decodedPayload
    }
}