import React, { useState } from 'react';

interface YouTubeVideoPlayerProps {
    /** URL completa del video de Google Drive */
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

    // Función para extraer el ID del archivo de Google Drive y convertir a URL de embed
    const getGoogleDriveEmbedUrl = (url: string): string | null => {
        // Patrones para diferentes formatos de URL de Google Drive
        const patterns = [
            /\/file\/d\/([a-zA-Z0-9-_]+)\/view/,
            /\/file\/d\/([a-zA-Z0-9-_]+)/,
            /id=([a-zA-Z0-9-_]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return `https://drive.google.com/file/d/${match[1]}/preview`;
            }
        }
        return null;
    };

    const embedUrl = getGoogleDriveEmbedUrl(videoUrl);

    if (!embedUrl) {
        return (
            <div className={`text-center p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
                <p className="text-red-600">Error: URL de Google Drive no válida</p>
                <p className="text-sm text-gray-600 mt-2">
                    Asegúrate de que el archivo sea público y la URL tenga el formato correcto
                </p>
            </div>
        );
    }

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
                    <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                            <div className="text-6xl mb-4">🎥</div>
                            <h4 className="text-xl font-bold mb-2">Video no disponible para reproducir aquí</h4>
                            <p className="text-sm mb-6 opacity-90">
                                El video puede tener restricciones de privacidad o no estar disponible para visualización externa.
                            </p>
                            <a
                                href={videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white text-blue-600 font-bold py-3 px-6 rounded-full hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2"
                            >
                                <span>📁</span>
                                Ver en Google Drive
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
                        title="Video de Google Drive"
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onError={() => setHasError(true)}
                    />
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