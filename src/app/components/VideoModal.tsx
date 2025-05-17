'use client';
import { useEffect } from 'react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export const VideoModal = ({ isOpen, onClose }: Props) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl w-full max-w-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-black hover:text-red-600 text-xl font-bold z-10"
                >
                    ×
                </button>
                <video
                    controls
                    className="w-full max-h-[80vh] object-contain rounded-b-2xl"
                >
                    <source src="/videos/video-tutorial.mp4" type="video/mp4" />
                    Tu navegador no soporta el video.
                </video>

            </div>
        </div>
    );
};
