import { z } from "zod"

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];

const formatBytes = (bytes: number, decimals = 2) => {
    console.log("hola")
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};


export const createCompanySchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().min(1, "La descripción es obligatoria"),
    bannerUrl: z
        .instanceof(File)
        .optional()
        .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
            message: `La imagen es demasiado grande. Elige una imagen menor de ${formatBytes(MAX_FILE_SIZE)}.`,
        })
        .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
            message: "Por favor sube un archivo de imagen válido (JPEG, PNG, WebP, PNG o AVIF).",
        }),
    logoUrl: z
        .instanceof(File)
        .optional()
        .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
            message: `La imagen es demasiado grande. Elige una imagen menor de ${formatBytes(MAX_FILE_SIZE)}.`,
        })
        .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), {
            message: "Por favor sube un archivo de imagen válido (JPEG, PNG, WebP, PNG o AVIF).",
        }),
    phone: z.string().optional(),
    address: z.string().optional(),
    industry: z.string().min(1, "La industria es obligatoria"),
    isVerified: z
        .union([z.boolean(), z.enum(['true', 'false'])])
        .transform((val) => {
            if (typeof val === 'string') {
                return val === 'true';
            }
            return val;
        })
        .optional(),
    socialLinks: z
        .string()
        .transform((str) => {
            try {
                const parsed = JSON.parse(str);
                return z.array(z.string().url("Debe ser una URL válida")).parse(parsed);
            } catch {
                return [];
            }
        })
        .optional(),
    website: z.string().url("Debe ser una URL válida").optional(),
});