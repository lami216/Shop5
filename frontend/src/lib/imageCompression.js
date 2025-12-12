export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

const fileToDataURL = (file) =>
        new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => {
                        if (typeof reader.result === "string") {
                                resolve(reader.result);
                        } else {
                                reject(new Error("Failed to read file as data URL"));
                        }
                };

                reader.onerror = () => reject(new Error("Failed to read file"));
                reader.readAsDataURL(file);
        });

const loadImage = (dataUrl) =>
        new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error("Failed to load image"));
                image.src = dataUrl;
        });

const calculateDataUrlSize = (dataUrl) => {
        const base64String = dataUrl.split(",")[1] ?? "";
        return Math.ceil((base64String.length * 3) / 4);
};

const getPreferredMimeType = (canvas) => {
        try {
                const probe = canvas.toDataURL("image/webp");
                if (probe.startsWith("data:image/webp")) {
                        return "image/webp";
                }
        } catch (error) {
                console.warn("WebP is not supported, falling back to JPEG", error);
        }

        return "image/jpeg";
};

const buildFileName = (file, mimeType) => {
        const extension = mimeType === "image/webp" ? "webp" : "jpg";
        const baseName = file?.name?.split(".")?.slice(0, -1)?.join(".")?.trim();

        if (baseName?.length) {
                return `${baseName}.${extension}`;
        }

        return `compressed-image.${extension}`;
};

export const compressImage = async (file) => {
        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
                throw new Error("IMAGE_TOO_LARGE_PREPROCESSING");
        }

        const initialDataUrl = await fileToDataURL(file);
        const image = await loadImage(initialDataUrl);

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
                throw new Error("Failed to get canvas context");
        }

        const preferredMimeType = getPreferredMimeType(canvas);
        const qualitySteps = [
                0.9,
                0.85,
                0.8,
                0.75,
                0.7,
                0.65,
                0.6,
                0.55,
                0.5,
                0.45,
                0.4,
                0.35,
                0.3,
                0.25,
                0.2,
                0.15,
                0.1,
        ];

        const dimensionScales = [1, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5];

        for (const scale of dimensionScales) {
                const width = Math.max(Math.floor(image.width * scale), 1);
                const height = Math.max(Math.floor(image.height * scale), 1);

                canvas.width = width;
                canvas.height = height;
                context.clearRect(0, 0, width, height);
                context.drawImage(image, 0, 0, width, height);

                for (const quality of qualitySteps) {
                        const compressedDataUrl = canvas.toDataURL(preferredMimeType, quality);
                        const compressedSize = calculateDataUrlSize(compressedDataUrl);

                        if (compressedSize <= MAX_IMAGE_SIZE_BYTES) {
                                return {
                                        dataUrl: compressedDataUrl,
                                        fileName: buildFileName(file, preferredMimeType),
                                        mimeType: preferredMimeType,
                                        wasCompressed: true,
                                };
                        }
                }
        }

        throw new Error("Unable to compress image within size limit");
};
