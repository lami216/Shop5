export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

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

export const compressImage = async (file) => {
        const initialDataUrl = await fileToDataURL(file);

        if (file.size <= MAX_IMAGE_SIZE_BYTES) {
                return { dataUrl: initialDataUrl, wasCompressed: false };
        }

        const image = await loadImage(initialDataUrl);
        let quality = 0.9;
        let width = image.width;
        let height = image.height;

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
                throw new Error("Failed to get canvas context");
        }

        let compressedDataUrl = initialDataUrl;
        let compressedSize = calculateDataUrlSize(initialDataUrl);

        while (quality >= 0.3 || (width > 400 && height > 400)) {
                canvas.width = width;
                canvas.height = height;
                context.clearRect(0, 0, width, height);
                context.drawImage(image, 0, 0, width, height);

                compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
                compressedSize = calculateDataUrlSize(compressedDataUrl);

                if (compressedSize <= MAX_IMAGE_SIZE_BYTES) {
                        return { dataUrl: compressedDataUrl, wasCompressed: true };
                }

                if (quality > 0.3) {
                        quality = Math.max(quality - 0.1, 0.3);
                } else {
                        width = Math.max(Math.floor(width * 0.9), 1);
                        height = Math.max(Math.floor(height * 0.9), 1);
                }
        }

        if (compressedSize <= MAX_IMAGE_SIZE_BYTES) {
                return { dataUrl: compressedDataUrl, wasCompressed: true };
        }

        throw new Error("Unable to compress image within size limit");
};
