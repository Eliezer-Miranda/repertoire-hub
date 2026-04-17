export type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  bpm?: number;
  key?: string; // musical key e.g. "G", "Am"
  cover?: string;
  filePath: string; // SMB path simulated
  format: "mp3" | "wav" | "flac";
  tags: string[];
  favorite?: boolean;
};

export type Album = {
  id: string;
  name: string;
  artist: string;
  cover?: string;
  year?: number;
  songCount: number;
};

export type Artist = {
  id: string;
  name: string;
  cover?: string;
  albumCount: number;
  songCount: number;
};

export type RepertoireItem = {
  songId: string;
  order: number;
};

export type Repertoire = {
  id: string;
  name: string;
  minister: string;
  date: string; // ISO
  service: "manha" | "noite" | "especial" | "ensaio";
  items: RepertoireItem[];
  createdAt: string;
  notes?: string;
};
