export interface VinylRecord {
  id: string;
  catalogNumber: string;
  artist: string;
  title: string;
  label: string;
  format: string;
  rating: number | null;
  releaseYear: number | null;
  dateAdded: string;
  collectionFolder: string;
  spotifyAlbumArt: string | null;
  spotifyArtistUrl: string | null;
  spotifyAlbumUrl: string | null;
  discogsId: string | null;
  low: string | null;
  median: string | null;
  high: string | null;
} 