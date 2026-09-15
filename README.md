#Zertec

TODO: Document your project here

## Rodar o repertório direto no Reaper

O app grava `S:\VS\<Ministro_Data>\repertorio.json`. O script
`reaper/MusicLib_Importar_Repertorio.lua` lê esse arquivo e monta a sessão
(faixas MÚSICA / PAD / CLICK, uma região por música e BPM por música).

1. Copie `reaper/MusicLib_Importar_Repertorio.lua` para `<REAPER>\Scripts\`
   (Options → Show REAPER resource path).
2. No Reaper: Actions → Show action list → **ReaScript: Load...** → escolha o arquivo.
3. Opcional: atribua um atalho ou botão de toolbar à ação.
4. Rode a ação, escolha o `repertorio.json` em `S:\VS\<Ministro_Data>\` e o
   repertório abre numa nova aba de projeto.

Ajustes no topo do script: `VS_ROOT`, `GAP_SECONDS`, `NEW_PROJECT` e `PATH_MAP`
(troca `\\192.168.2.177\storage\` por `S:\` caso o Reaper não acesse o caminho UNC).
