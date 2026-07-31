'use client';

import { VinylRecord } from '@/types/vinyl';

interface VinylRecordCardProps {
  record: VinylRecord;
  onClick: () => void;
  index: number;
}

export default function VinylRecordCard({ record, onClick, index }: VinylRecordCardProps) {
  const hasAlbumArt = record.spotifyAlbumArt;
  
  return (
    <div
      className="group relative cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onClick}
    >
      {/* Vinyl record container */}
      <div className="relative w-full aspect-square rounded-full bg-gradient-to-br from-gray-800 to-black border-4 border-vinyl-gold/30 shadow-2xl overflow-hidden">
        
        {/* Album art or placeholder */}
        {hasAlbumArt ? (
          <div className="absolute inset-2 rounded-full overflow-hidden">
            <img
              src={record.spotifyAlbumArt}
              alt={`${record.title} by ${record.artist}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-vinyl-gold text-2xl mb-2">🎵</div>
              <div className="text-xs text-gray-400 px-2 text-center leading-tight">
                {record.title.length > 20 ? record.title.substring(0, 20) + '...' : record.title}
              </div>
            </div>
          </div>
        )}
        
        {/* Vinyl center label */}
        <div className="absolute inset-1/3 rounded-full bg-gradient-to-br from-vinyl-gold/80 to-amber-600/80 border-2 border-vinyl-gold/50 flex items-center justify-center">
          <div className="w-2 h-2 bg-black rounded-full"></div>
        </div>
        
        {/* Vinyl grooves effect */}
        <div className="absolute inset-0 rounded-full opacity-20">
          <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(255,255,255,0.1)_31%,_transparent_32%)] bg-[length:8px_8px]"></div>
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
            <div className="text-vinyl-gold text-sm font-semibold mb-1">
              {record.artist.length > 15 ? record.artist.substring(0, 15) + '...' : record.artist}
            </div>
            <div className="text-white text-xs">
              {record.title.length > 20 ? record.title.substring(0, 20) + '...' : record.title}
            </div>
          </div>
        </div>
        
        {/* Rating indicator */}
        {record.rating && (
          <div className="absolute top-2 right-2 bg-vinyl-gold/90 text-black text-xs px-2 py-1 rounded-full font-bold">
            {record.rating}/5
          </div>
        )}
        
        {/* Year indicator */}
        {record.releaseYear && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {record.releaseYear}
          </div>
        )}
      </div>
      
      {/* Shadow */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-2 bg-black/30 rounded-full blur-sm group-hover:scale-110 transition-transform duration-300"></div>
    </div>
  );
} 