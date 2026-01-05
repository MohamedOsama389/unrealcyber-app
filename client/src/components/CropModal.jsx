import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

const CropModal = ({ image, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropAreaChange = useCallback((activeArea, activeAreaPixels) => {
        setCroppedAreaPixels(activeAreaPixels);
    }, []);

    const handleConfirm = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
            onCropComplete(croppedImageBlob);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-panel border border-border rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-border flex justify-between items-center bg-panel/50">
                    <div>
                        <h2 className="text-xl font-bold text-primary">Crop Profile Picture</h2>
                        <p className="text-xs text-secondary">Drag and zoom to perfectly frame your avatar.</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 dark:hover:bg-slate-800 rounded-full text-secondary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="relative h-96 bg-app">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1 / 1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropAreaChange}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-secondary uppercase tracking-widest">
                            <span>Zoom</span>
                            <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="w-full h-2 bg-panel border border-border rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 bg-panel border border-border hover:bg-white/10 dark:hover:bg-slate-700 text-primary rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            Set Profile Picture
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to get the cropped image
const getCroppedImg = (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg');
        };
        image.onerror = (error) => reject(error);
    });
};

export default CropModal;
