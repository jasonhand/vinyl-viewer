'use client';

import { VinylRecord } from '@/types/vinyl';
import VinylRecordCard from './VinylRecordCard';

interface VinylShelfProps {
  records: VinylRecord[];
  onRecordClick: (record: VinylRecord) => void;
}

export default function VinylShelf({ records, onRecordClick }: VinylShelfProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-vinyl-gold text-6xl mb-4">🎵</div>
        <h3 className="text-2xl font-semibold text-white mb-2">No records found</h3>
        <p className="text-gray-400">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Shelf background */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-amber-800/10 to-transparent rounded-lg"></div>
      
      {/* Vinyl records grid */}
      <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6 p-6">
        {records.map((record, index) => (
          <VinylRecordCard
            key={record.id}
            record={record}
            onClick={() => onRecordClick(record)}
            index={index}
          />
        ))}
      </div>
      
      {/* Shelf edge effect */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-amber-800/40 to-transparent rounded-b-lg"></div>
    </div>
  );
} 