'use client';

import { useState, useEffect } from 'react';
import VinylShelf from '@/components/VinylShelf';
import VinylModal from '@/components/VinylModal';
import SearchBar from '@/components/SearchBar';
import { VinylRecord } from '@/types/vinyl';

export default function Home() {
  const [records, setRecords] = useState<VinylRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<VinylRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<VinylRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/output.json')
      .then(res => res.json())
      .then(data => {
        const processedRecords = data.map((record: any) => ({
          id: record.release_id || Math.random().toString(),
          catalogNumber: record['Catalog#'] || '',
          artist: record.Artist || 'Unknown Artist',
          title: record.Title || 'Unknown Title',
          label: record.Label || '',
          format: record.Format || '',
          rating: record.Rating || null,
          releaseYear: record['Release_Year'] || null,
          dateAdded: record['Date Added'] || '',
          collectionFolder: record['CollectionFolder'] || '',
          spotifyAlbumArt: record['Spotify Album Art URL'] || null,
          spotifyArtistUrl: record['Spotify Artist URL'] || null,
          spotifyAlbumUrl: record['Spotify Album URL'] || null,
          discogsId: record['Discogs_ID'] || null,
          low: record.Low || null,
          median: record.Median || null,
          high: record.High || null,
        }));
        setRecords(processedRecords);
        setFilteredRecords(processedRecords);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading records:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRecords(records);
    } else {
      const filtered = records.filter(record =>
        record.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecords(filtered);
    }
  }, [searchQuery, records]);

  const handleRecordClick = (record: VinylRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-vinyl-gold mx-auto mb-4"></div>
          <p className="text-vinyl-gold text-lg">Loading your vinyl collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-vinyl-gold/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-vinyl-gold mb-2">
                Vinyl Collection
              </h1>
              <p className="text-gray-300 text-lg">
                {filteredRecords.length} records in your collection
              </p>
            </div>
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search artists, titles, or labels..."
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <VinylShelf 
          records={filteredRecords}
          onRecordClick={handleRecordClick}
        />
      </main>

      {/* Modal */}
      {selectedRecord && (
        <VinylModal
          record={selectedRecord}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  );
} 