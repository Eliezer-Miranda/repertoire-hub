import { Song, Album, Artist, Repertoire } from "@/types/music";

// Cover gradients (CSS) used as fallbacks when no image
const covers = [
  "linear-gradient(135deg, hsl(270 85% 60%), hsl(330 85% 60%))",
  "linear-gradient(135deg, hsl(200 85% 55%), hsl(175 75% 45%))",
  "linear-gradient(135deg, hsl(20 90% 60%), hsl(350 85% 55%))",
  "linear-gradient(135deg, hsl(45 95% 55%), hsl(15 90% 55%))",
  "linear-gradient(135deg, hsl(290 80% 55%), hsl(220 85% 55%))",
  "linear-gradient(135deg, hsl(140 70% 45%), hsl(180 70% 45%))",
  "linear-gradient(135deg, hsl(340 80% 60%), hsl(280 80% 55%))",
  "linear-gradient(135deg, hsl(220 70% 35%), hsl(260 80% 50%))",
];

const artistsData = [
  { name: "Hillsong Worship", albums: ["Awake", "There Is More", "Let There Be Light"] },
  { name: "Bethel Music", albums: ["Victory", "Heaven Come", "Starlight"] },
  { name: "Elevation Worship", albums: ["Graves Into Gardens", "Lion", "At Midnight"] },
  { name: "Casa Worship", albums: ["Tu És Bom", "Coração Aberto"] },
  { name: "Diante do Trono", albums: ["Aleluia", "Tu Reinas"] },
  { name: "Gabriela Rocha", albums: ["Gerações", "Atos 2"] },
  { name: "Fernandinho", albums: ["Galileu", "Uma Nova História"] },
  { name: "Morada", albums: ["Sumidouro", "O Tempo"] },
];

const songNames = [
  ["Oceans", "What a Beautiful Name", "Mighty to Save", "Cornerstone"],
  ["Goodness of God", "Raise a Hallelujah", "No Longer Slaves", "Reckless Love"],
  ["Graves Into Gardens", "See a Victory", "O Come to the Altar", "Here Again"],
  ["Tu És Santo", "Oceanos", "Lugar Secreto"],
  ["Aleluia", "Quero Conhecer Jesus", "Tu Reinas"],
  ["Atos 2", "Gerações", "Águas Purificadoras"],
  ["Galileu", "Uma Nova História", "Grandes Coisas"],
  ["Sumidouro", "Lindo És", "O Tempo"],
];

const keys = ["C", "G", "D", "A", "E", "B", "F", "Bb", "Em", "Am", "Dm", "F#m"];
const tagPool = ["adoração", "entrada", "ofertório", "comunhão", "louvor", "ministração", "saída", "intimismo"];

let songIdCounter = 0;
const songs: Song[] = [];
const albums: Album[] = [];
const artists: Artist[] = [];

artistsData.forEach((art, ai) => {
  let songCount = 0;
  art.albums.forEach((albName, alIdx) => {
    const albumId = `${ai}-${alIdx}`;
    const trackList = songNames[ai] || songNames[0];
    trackList.forEach((title, ti) => {
      songIdCounter++;
      const coverIdx = (ai + alIdx + ti) % covers.length;
      songs.push({
        id: `s-${songIdCounter}`,
        title,
        artist: art.name,
        album: albName,
        duration: 180 + Math.floor(Math.random() * 240),
        bpm: 60 + Math.floor(Math.random() * 80),
        key: keys[Math.floor(Math.random() * keys.length)],
        cover: covers[coverIdx],
        filePath: `/storage/biblioteca/${art.name}/${albName}/${title}.mp3`,
        format: "mp3",
        tags: [tagPool[Math.floor(Math.random() * tagPool.length)]],
        favorite: Math.random() > 0.75,
      });
      songCount++;
    });
    albums.push({
      id: albumId,
      name: albName,
      artist: art.name,
      cover: covers[(ai + alIdx) % covers.length],
      year: 2018 + Math.floor(Math.random() * 7),
      songCount: trackList.length,
    });
  });
  artists.push({
    id: `a-${ai}`,
    name: art.name,
    cover: covers[ai % covers.length],
    albumCount: art.albums.length,
    songCount,
  });
});

export const mockSongs = songs;
export const mockAlbums = albums;
export const mockArtists = artists;

export const mockRepertoires: Repertoire[] = [
  {
    id: "r-1",
    name: "Culto da Manhã - 14/04",
    minister: "Pr. João Silva",
    date: new Date().toISOString(),
    service: "manha",
    items: songs.slice(0, 5).map((s, i) => ({ songId: s.id, order: i })),
    createdAt: new Date().toISOString(),
    notes: "Tom rebaixado em duas músicas conforme ensaio.",
  },
  {
    id: "r-2",
    name: "Culto da Noite - Especial Adoração",
    minister: "Min. Maria Costa",
    date: new Date(Date.now() + 86400000).toISOString(),
    service: "noite",
    items: songs.slice(8, 14).map((s, i) => ({ songId: s.id, order: i })),
    createdAt: new Date().toISOString(),
  },
];
