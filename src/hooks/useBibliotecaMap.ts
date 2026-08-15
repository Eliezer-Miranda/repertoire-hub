import { useCallback, useEffect, useState } from "react";
import { useLibrary } from "@/store/useLibrary";
import { BIBLIOTECA_MAP_URL, fetchBibliotecaMap, parseBibliotecaMap } from "@/lib/bibliotecaMap";
import { toast } from "sonner";

/**
 * Carrega automaticamente a biblioteca do `biblioteca-map.json`
 * (gerado em /mnt/vs-dados/ no servidor e servido em /biblioteca-map.json).
 * Se o arquivo não existir, mantém a biblioteca atual.
 */
export function useBibliotecaMap(auto = true) {
  const setSongs = useLibrary((s) => s.setSongs);
  const librarySource = useLibrary((s) => s.librarySource);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (url = BIBLIOTECA_MAP_URL, silent = false) => {
      setLoading(true);
      try {
        const songs = await fetchBibliotecaMap(url);
        if (songs.length === 0) throw new Error("Nenhuma faixa encontrada no mapa");
        setSongs(songs, url);
        if (!silent) toast.success(`Biblioteca carregada: ${songs.length} faixas`);
        return songs.length;
      } catch (e) {
        if (!silent) toast.error("Não foi possível ler o biblioteca-map.json", { description: String(e) });
        return 0;
      } finally {
        setLoading(false);
      }
    },
    [setSongs]
  );

  const loadFromFile = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const songs = parseBibliotecaMap(JSON.parse(await file.text()));
        if (songs.length === 0) throw new Error("Nenhuma faixa encontrada no mapa");
        setSongs(songs, file.name);
        toast.success(`Biblioteca importada: ${songs.length} faixas`);
      } catch (e) {
        toast.error("JSON inválido", { description: String(e) });
      } finally {
        setLoading(false);
      }
    },
    [setSongs]
  );

  useEffect(() => {
    if (auto) load(BIBLIOTECA_MAP_URL, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  return { loading, load, loadFromFile, librarySource };
}
