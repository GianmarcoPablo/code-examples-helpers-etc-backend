import { Hono } from "hono";
import { prisma } from "../../lib";
import { encodeBase64 } from "hono/utils/encode";
import { zValidator } from "@hono/zod-validator"
import { v2 as cloudinary } from "cloudinary";
import { createCompanySchema } from "../../schemas/company-create";
import { config } from "../../lib/cloudinary";
import { AuthMiddleware } from "../../middlewares/auth.middleware";

interface CloudinaryValidation {
    maxSize: number; // en bytes
    allowedFormats: string[];
}

// Configuraciones de validación
const CLOUDINARY_VALIDATIONS: Record<string, CloudinaryValidation> = {
    'company-logos': {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp', "avif"],
    },
    'company-banners': {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp', "avif"],
    }
};

const MAX_COMPANIES = {
    free: 2,
    premium: 4,
};

cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

console.log({ name: config.cloudinary.cloud_name, api_key: config.cloudinary.api_key, api_secret: config.cloudinary.api_secret })

export class CompanyRoutes {

    constructor(

    ) { }

    static get routes(): Hono {

        const router = new Hono();

        router.post("/",
            AuthMiddleware.isAuth,
            zValidator("form", createCompanySchema),
            async (c) => {
                try {
                    const defaultBanner = "https://res.cloudinary.com/dcij2jfka/image/upload/v1741186406/t9ua5i8g0ohrl8h1sgvb.jpg"

                    const defaultLogo = "https://res.cloudinary.com/dcij2jfka/image/upload/v1741186742/twdxc1ykqpgs4z3lrkvr.png"

                    const user = c.req.user!;
                    const data = c.req.valid('form')
                    const [logoUrl, bannerUrl] = await Promise.all([
                        this.processFile(data.logoUrl, "company-banners"),
                        this.processFile(data.bannerUrl, "company-logos")
                    ]);

                    const totalCompanies = await prisma.company.count({ where: { userId: user.id } })
                    const isPremium = user.roles.includes("premiun");
                    const maxAllowed = isPremium ? MAX_COMPANIES.premium : MAX_COMPANIES.free;

                    if (totalCompanies >= maxAllowed) {
                        return c.json({ message: "No se puede crear más de " + maxAllowed + " empresas" }, 400)
                    }

                    const company = await prisma.company.create({
                        data: {
                            ...data,
                            logoUrl: logoUrl || defaultLogo,
                            bannerUrl: bannerUrl || defaultBanner,
                            userId: user.id,
                        }
                    })

                    return c.json(company)
                } catch (error) {
                    console.error({ error });
                }
            });

        router.get("/one-company-of-user/:id",
            AuthMiddleware.isAuth,
            async (c) => {
                const user = c.req.user!;
                const id = c.req.param("id")
                const company = await prisma.company.findUnique({ where: { id, userId: user.id } })
                return c.json(company)
            })

        router.get("/", async (c) => {
            const companies = await prisma.company.findMany()
            return c.json(companies)
        })

        return router
    }

    static async processFile(file: File | undefined, folder: string) {
        if (!file) return null;

        try {

            await this.validateFile(file, folder);
            const byteArrayBuffer = await file.arrayBuffer();
            const base64 = encodeBase64(byteArrayBuffer);
            const results = await cloudinary.uploader.upload(
                `data:image/png;base64,${base64}`,
                { folder },

            );
            return results.secure_url;

        } catch (error) {
            console.error(`Error processing file for ${folder}:`, error);
            throw error;
        }
    }

    static async validateFile(file: File, folder: string): Promise<void> {
        const validation = CLOUDINARY_VALIDATIONS[folder];
        if (!validation) {
            throw new Error(`No validation rules found for folder: ${folder}`);
        }

        // Validar tamaño
        if (file.size > validation.maxSize) {
            throw new Error(`File size exceeds maximum allowed size of ${validation.maxSize / (1024 * 1024)}MB`);
        }

        // Validar formato
        const format = file.type.split('/')[1];
        if (!validation.allowedFormats.includes(format)) {
            throw new Error(`File format ${format} is not allowed. Allowed formats: ${validation.allowedFormats.join(', ')}`);
        }

    }


    static async updateFile(newFile: File | undefined, oldUrl: string | null, folder: string) {
        if (!newFile) return null;

        try {
            // Subir nueva imagen a Cloudinary
            await this.validateFile(newFile, folder);
            const byteArrayBuffer = await newFile.arrayBuffer();
            const base64 = encodeBase64(byteArrayBuffer);
            const results = await cloudinary.uploader.upload(
                `data:image/png;base64,${base64}`,
                { folder }
            );

            // Eliminar la imagen antigua si existe
            if (oldUrl) {
                const publicId = this.extractPublicId(oldUrl);
                await cloudinary.uploader.destroy(publicId);
            }

            return results.secure_url;

        } catch (error) {
            console.error(`Error updating file for ${folder}:`, error);
            throw error;
        }
    }

    static extractPublicId(url: string): string {
        const regex = /\/([^\/]+)\.(jpg|jpeg|png|webp|avif)$/;
        const match = url.match(regex);
        if (!match) throw new Error("Invalid Cloudinary URL");

        // Formato: {folder}/{public_id}
        const path = url.split("/").slice(-3).join("/");
        const [folder, publicId] = path.split("/").slice(-2);
        return `${folder}/${publicId}`;
    }
}