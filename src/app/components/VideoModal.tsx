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
                    className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 text-xl font-bold z-10 px-4 py-2 rounded-full"
                >
                    x
                </button>
                <iframe
                    src="https://drive.google.com/file/d/1hTTc4ZMxO5cnuVhiA2zWwkzoxfz29fS4/preview"
                    width="100%"
                    height="480"
                    allow="autoplay"
                    className="rounded-b-2xl w-full max-h-[80vh]"
                ></iframe>
            </div>
        </div>
    );
};
