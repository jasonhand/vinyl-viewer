'use client';

import { VinylRecord } from '@/types/vinyl';

interface VinylModalProps {
  record: VinylRecord;
  isOpen: boolean;
  onClose: () => void;
}

export default function VinylModal({ record, isOpen, onClose }: VinylModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-br from-gray-900 to-black border border-vinyl-gold/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-vinyl-gold/20">
          <h2 className="text-2xl font-bold text-vinyl-gold">Record Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-vinyl-gold transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left side - Album art and basic info */}
            <div className="space-y-6">
              {/* Album art */}
              <div className="relative">
                {record.spotifyAlbumArt ? (
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      src={record.spotifyAlbumArt}
                      alt={`${record.title} by ${record.artist}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Vinyl overlay effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20"></div>
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-2xl">
                    <div className="text-center">
                      <div className="text-vinyl-gold text-6xl mb-4">🎵</div>
                      <p className="text-gray-400">No album art available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Basic info */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{record.title}</h1>
                  <p className="text-xl text-vinyl-gold">{record.artist}</p>
                </div>

                {/* Rating */}
                {record.rating && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Rating:</span>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${i < record.rating! ? 'text-vinyl-gold' : 'text-gray-600'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                )}

                {/* External links */}
                <div className="flex space-x-4">
                  {record.spotifyAlbumUrl && (
                    <a
                      href={record.spotifyAlbumUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      <span>Listen on Spotify</span>
                    </a>
                  )}
                  
                  {record.spotifyArtistUrl && (
                    <a
                      href={record.spotifyArtistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      <span>Artist Profile</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Detailed info */}
            <div className="space-y-6">
              {/* Record details */}
              <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-semibold text-vinyl-gold mb-4">Record Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Label</span>
                    <p className="text-white font-medium">{record.label}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-400 text-sm">Format</span>
                    <p className="text-white font-medium">{record.format}</p>
                  </div>
                  
                  {record.catalogNumber && (
                    <div>
                      <span className="text-gray-400 text-sm">Catalog #</span>
                      <p className="text-white font-medium">{record.catalogNumber}</p>
                    </div>
                  )}
                  
                  {record.releaseYear && (
                    <div>
                      <span className="text-gray-400 text-sm">Release Year</span>
                      <p className="text-white font-medium">{record.releaseYear}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-400 text-sm">Collection</span>
                    <p className="text-white font-medium">{record.collectionFolder}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-400 text-sm">Date Added</span>
                    <p className="text-white font-medium">{new Date(record.dateAdded).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Market value */}
              {(record.low || record.median || record.high) && (
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-vinyl-gold mb-4">Market Value</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {record.low && (
                      <div className="text-center">
                        <span className="text-gray-400 text-sm">Low</span>
                        <p className="text-green-400 font-bold text-lg">{record.low}</p>
                      </div>
                    )}
                    {record.median && (
                      <div className="text-center">
                        <span className="text-gray-400 text-sm">Median</span>
                        <p className="text-vinyl-gold font-bold text-lg">{record.median}</p>
                      </div>
                    )}
                    {record.high && (
                      <div className="text-center">
                        <span className="text-gray-400 text-sm">High</span>
                        <p className="text-red-400 font-bold text-lg">{record.high}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 