
export class HashPasswordService {

    static async hash(password: string): Promise<string> {
        const hashPassword = await Bun.password.hash(password)
        return hashPassword
    }

    static async compare(password: string, hashedPassword: string): Promise<boolean> {
        const isPasswordValid = await Bun.password.verify(password, hashedPassword)
        if (!isPasswordValid) return false
        return true
    }
}