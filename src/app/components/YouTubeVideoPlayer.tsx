import React, { useState } from 'react';

interface YouTubeVideoPlayerProps {
    /** URL completa del video de YouTube */
    videoUrl: string;
    /** Título opcional para mostrar encima del video */
    title?: string;
    /** Descripción opcional para mostrar debajo del video */
    description?: string;
    /** Clase CSS adicional para el contenedor */
    className?: string;
}

export const YouTubeVideoPlayer: React.FC<YouTubeVideoPlayerProps> = ({
    videoUrl,
    title,
    description,
    className = ""
}) => {
    const [hasError, setHasError] = useState(false);

    // Función para extraer el ID del video de YouTube de diferentes formatos de URL
    const getYouTubeVideoId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    };

    const videoId = getYouTubeVideoId(videoUrl);

    if (!videoId) {
        return (
            <div className={`text-center p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
                <p className="text-red-600">Error: URL de video de YouTube no válida</p>
            </div>
        );
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Si hay error o video bloqueado, mostrar alternativa
    if (hasError) {
        return (
            <div className={`w-full ${className}`}>
                {title && (
                    <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">
                        {title}
                    </h3>
                )}

                <div className="relative w-full">
                    <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                            <div className="text-6xl mb-4">🎥</div>
                            <h4 className="text-xl font-bold mb-2">Video no disponible para reproducir aquí</h4>
                            <p className="text-sm mb-6 opacity-90">
                                Este video tiene restricciones de derechos de autor que impiden su reproducción en sitios externos.
                            </p>
                            <a
                                href={watchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white text-red-600 font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2"
                            >
                                <span>▶️</span>
                                Ver en YouTube
                            </a>
                        </div>
                    </div>
                </div>

                {description && (
                    <p className="text-gray-600 text-sm text-center mt-4 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`}>
            {title && (
                <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">
                    {title}
                </h3>
            )}

            <div className="relative w-full">
                {/* Contenedor responsivo para el iframe */}
                <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl shadow-lg">
                    <iframe
                        src={embedUrl}
                        title="Video de YouTube"
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        onError={() => setHasError(true)}
                    />
                </div>

                {/* Botón alternativo siempre visible */}
                <div className="text-center mt-4">
                    <a
                        href={watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                        <span>▶️</span>
                        Ver en YouTube
                    </a>
                </div>
            </div>

            {description && (
                <p className="text-gray-600 text-sm text-center mt-4 leading-relaxed">
                    {description}
                </p>
            )}
        </div>
    );
};