--[[
  MusicLib — Importar repertorio.json no Reaper (ReaScript Lua, sem dependências)

  Lê S:\VS\<Ministro_Data>\repertorio.json (gerado pelo app MusicLib) e monta a
  sessão: uma faixa "MÚSICA", uma "PAD" e uma "CLICK", com os itens em sequência,
  uma região por música e marcadores de andamento (BPM / compasso) por música.

  Instalação (uma vez):
    1. Copie este arquivo para  <REAPER>\Scripts\  (Options → Show REAPER resource path).
    2. Actions → Show action list → ReaScript: Load...  → escolha este arquivo.
    3. (Opcional) atribua um atalho ou botão de toolbar à ação "MusicLib_Importar_Repertorio.lua".

  Uso:
    Rode a ação. Abre um diálogo já em S:\VS — escolha o repertorio.json da pasta
    do ministro/data. O repertório é montado numa nova aba de projeto.

  Ajustes:
    VS_ROOT       pasta onde o app grava os repertórios (S:\VS).
    GAP_SECONDS   silêncio entre músicas na linha do tempo.
    PATH_MAP      se o Reaper não enxergar o caminho UNC (\\servidor\share), mapeia
                  para a unidade de rede correspondente (S: = \\192.168.2.177\storage).
    NEW_PROJECT   true = monta em nova aba; false = insere no projeto atual (a partir do cursor).
]]

local VS_ROOT = "S:\\VS\\"
local GAP_SECONDS = 2
local NEW_PROJECT = true
local PATH_MAP = {
  ["\\\\192.168.2.177\\storage\\"] = "S:\\",
}

---------------------------------------------------------------------------
-- JSON (subconjunto suficiente para o manifesto)
---------------------------------------------------------------------------
local json = {}

local function decode_error(str, i, msg)
  local line, col = 1, 1
  for k = 1, i - 1 do
    if str:sub(k, k) == "\n" then line, col = line + 1, 1 else col = col + 1 end
  end
  error(("JSON inválido (linha %d, coluna %d): %s"):format(line, col, msg), 0)
end

local function skip_ws(str, i)
  return (str:find("[^ \t\r\n]", i)) or (#str + 1)
end

local escapes = { ['"'] = '"', ["\\"] = "\\", ["/"] = "/", b = "\b", f = "\f", n = "\n", r = "\r", t = "\t" }

local parse_value

local function parse_string(str, i)
  local out, j = {}, i + 1
  while true do
    local c = str:sub(j, j)
    if c == "" then decode_error(str, j, "string não terminada") end
    if c == '"' then return table.concat(out), j + 1 end
    if c == "\\" then
      local e = str:sub(j + 1, j + 1)
      if e == "u" then
        local hex = str:sub(j + 2, j + 5)
        if not hex:match("^%x%x%x%x$") then decode_error(str, j, "escape \\u inválido") end
        local cp = tonumber(hex, 16)
        j = j + 6
        if cp >= 0xD800 and cp <= 0xDBFF and str:sub(j, j + 1) == "\\u" then
          local lo = tonumber(str:sub(j + 2, j + 5), 16)
          if lo and lo >= 0xDC00 and lo <= 0xDFFF then
            cp = 0x10000 + (cp - 0xD800) * 0x400 + (lo - 0xDC00)
            j = j + 6
          end
        end
        out[#out + 1] = utf8.char(cp)
      else
        local r = escapes[e]
        if not r then decode_error(str, j, "escape inválido \\" .. e) end
        out[#out + 1] = r
        j = j + 2
      end
    else
      out[#out + 1] = c
      j = j + 1
    end
  end
end

local function parse_number(str, i)
  local s, e = str:find("^-?%d+%.?%d*[eE]?[-+]?%d*", i)
  local n = tonumber(str:sub(s, e))
  if not n then decode_error(str, i, "número inválido") end
  return n, e + 1
end

local function parse_array(str, i)
  local arr, n, j = {}, 0, skip_ws(str, i + 1)
  if str:sub(j, j) == "]" then return arr, j + 1 end
  while true do
    local v
    v, j = parse_value(str, j)
    n = n + 1
    arr[n] = v
    j = skip_ws(str, j)
    local c = str:sub(j, j)
    if c == "]" then return arr, j + 1 end
    if c ~= "," then decode_error(str, j, "esperado ',' ou ']'") end
    j = skip_ws(str, j + 1)
  end
end

local function parse_object(str, i)
  local obj, j = {}, skip_ws(str, i + 1)
  if str:sub(j, j) == "}" then return obj, j + 1 end
  while true do
    if str:sub(j, j) ~= '"' then decode_error(str, j, "esperada chave string") end
    local k
    k, j = parse_string(str, j)
    j = skip_ws(str, j)
    if str:sub(j, j) ~= ":" then decode_error(str, j, "esperado ':'") end
    local v
    v, j = parse_value(str, skip_ws(str, j + 1))
    obj[k] = v
    j = skip_ws(str, j)
    local c = str:sub(j, j)
    if c == "}" then return obj, j + 1 end
    if c ~= "," then decode_error(str, j, "esperado ',' ou '}'") end
    j = skip_ws(str, j + 1)
  end
end

parse_value = function(str, i)
  i = skip_ws(str, i)
  local c = str:sub(i, i)
  if c == "{" then return parse_object(str, i) end
  if c == "[" then return parse_array(str, i) end
  if c == '"' then return parse_string(str, i) end
  if c == "-" or c:match("%d") then return parse_number(str, i) end
  if str:sub(i, i + 3) == "true" then return true, i + 4 end
  if str:sub(i, i + 4) == "false" then return false, i + 5 end
  if str:sub(i, i + 3) == "null" then return nil, i + 4 end
  decode_error(str, i, "valor inesperado")
end

function json.decode(str)
  str = str:gsub("^\239\187\191", "") -- BOM
  local v, i = parse_value(str, 1)
  if skip_ws(str, i) <= #str then decode_error(str, i, "conteúdo após o fim do JSON") end
  return v
end

---------------------------------------------------------------------------
-- Utilidades
---------------------------------------------------------------------------
local function read_file(path)
  local f, err = io.open(path, "rb")
  if not f then return nil, err end
  local s = f:read("a")
  f:close()
  return s
end

local function starts_with(s, prefix)
  return s:sub(1, #prefix):lower() == prefix:lower()
end

-- Devolve o primeiro caminho existente entre o original e os remapeados por PATH_MAP.
local function resolve_media(path)
  if not path or path == "" then return nil end
  local candidates = { path }
  for from, to in pairs(PATH_MAP) do
    if starts_with(path, from) then candidates[#candidates + 1] = to .. path:sub(#from + 1) end
  end
  for _, p in ipairs(candidates) do
    if reaper.file_exists(p) then return p end
  end
  return nil, candidates[1]
end

local function parse_timesig(sig)
  local num, den = tostring(sig or "4/4"):match("^(%d+)%s*/%s*(%d+)$")
  return tonumber(num) or 4, tonumber(den) or 4
end

local function add_track(name)
  local idx = reaper.CountTracks(0)
  reaper.InsertTrackAtIndex(idx, true)
  local tr = reaper.GetTrack(0, idx)
  reaper.GetSetMediaTrackInfo_String(tr, "P_NAME", name, true)
  return tr
end

-- Insere `file` em `track` na posição `pos`. Devolve o item e a duração da fonte.
local function add_item(track, file, pos, length, loop)
  local src = reaper.PCM_Source_CreateFromFile(file)
  if not src then return nil, 0 end
  local src_len = reaper.GetMediaSourceLength(src)
  local item = reaper.AddMediaItemToTrack(track)
  local take = reaper.AddTakeToMediaItem(item)
  reaper.SetMediaItemTake_Source(take, src)
  reaper.GetSetMediaItemTakeInfo_String(take, "P_NAME", file:match("([^\\/]+)$") or file, true)
  reaper.SetMediaItemInfo_Value(item, "D_POSITION", pos)
  reaper.SetMediaItemInfo_Value(item, "D_LENGTH", length or src_len)
  reaper.SetMediaItemInfo_Value(item, "B_LOOPSRC", loop and 1 or 0)
  return item, src_len
end

---------------------------------------------------------------------------
-- Importação
---------------------------------------------------------------------------
local function import_manifest(manifest)
  local rep = manifest.repertoire or {}
  local tracks = manifest.tracks or {}
  if #tracks == 0 then error("O manifesto não tem faixas (tracks).", 0) end

  local title = ("%s — %s (%s)"):format(rep.name or "Repertório", rep.minister or "", tostring(rep.date or ""):sub(1, 10))
  local warnings = {}

  reaper.Undo_BeginBlock()
  reaper.PreventUIRefresh(1)

  if NEW_PROJECT then
    reaper.Main_OnCommand(40859, 0) -- New project tab
    reaper.GetSetProjectInfo_String(0, "PROJECT_TITLE", title, true)
  end

  local tr_song = add_track("MÚSICA")
  local tr_pad = add_track("PAD")
  local tr_click = add_track("CLICK")

  local pos = NEW_PROJECT and 0 or reaper.GetCursorPosition()
  local placed = 0

  for _, t in ipairs(tracks) do
    local paths = t.paths or {}
    local label = ("%02d %s"):format(tonumber(t.order) or placed + 1, t.title or "?")
    local length = tonumber(t.duration) or 0

    local song_file, missing = resolve_media(paths.song)
    if song_file then
      local _, src_len = add_item(tr_song, song_file, pos, nil, false)
      if src_len > 0 then length = src_len end
    else
      warnings[#warnings + 1] = ("Música não encontrada: %s"):format(missing or "?")
    end
    if length <= 0 then length = 240 end

    local pad_file, pad_missing = resolve_media(paths.pad)
    if pad_file then
      add_item(tr_pad, pad_file, pos, length, true)
    elseif paths.pad then
      warnings[#warnings + 1] = ("Pad não encontrado: %s"):format(pad_missing or "?")
    end

    local click_file, click_missing = resolve_media(paths.click)
    if click_file then
      add_item(tr_click, click_file, pos, nil, false)
    elseif paths.click then
      warnings[#warnings + 1] = ("Click não encontrado: %s"):format(click_missing or "?")
    end

    local bpm = tonumber(t.click and t.click.bpm) or tonumber(t.bpm)
    if bpm and bpm > 0 then
      local num, den = parse_timesig(t.click and t.click.timeSignature)
      reaper.SetTempoTimeSigMarker(0, -1, pos, -1, -1, bpm, num, den, false)
    end

    local key = t.key and (" [" .. t.key .. "]") or ""
    reaper.AddProjectMarker2(0, true, pos, pos + length, label .. key, -1, 0)

    pos = pos + length + GAP_SECONDS
    placed = placed + 1
  end

  reaper.SetEditCurPos(NEW_PROJECT and 0 or reaper.GetCursorPosition(), false, false)
  reaper.PreventUIRefresh(-1)
  reaper.UpdateTimeline()
  reaper.UpdateArrange()
  reaper.Undo_EndBlock("MusicLib: importar repertório " .. title, -1)

  return placed, warnings
end

local function main()
  local ok, file = reaper.GetUserFileNameForRead(VS_ROOT, "MusicLib — selecione o repertorio.json", "json")
  if not ok or not file or file == "" then return end

  local text, err = read_file(file)
  if not text then
    reaper.ShowMessageBox("Não foi possível ler:\n" .. file .. "\n\n" .. tostring(err), "MusicLib", 0)
    return
  end

  local parsed, manifest = pcall(json.decode, text)
  if not parsed then
    reaper.ShowMessageBox(tostring(manifest), "MusicLib — erro ao ler repertorio.json", 0)
    return
  end

  local done, count, warnings = pcall(import_manifest, manifest)
  if not done then
    reaper.ShowMessageBox(tostring(count), "MusicLib — erro na importação", 0)
    return
  end

  local msg = ("%d música(s) importada(s) de:\n%s"):format(count, file)
  if #warnings > 0 then
    msg = msg .. ("\n\n%d aviso(s):\n- %s"):format(#warnings, table.concat(warnings, "\n- "))
  end
  reaper.ShowMessageBox(msg, "MusicLib", 0)
end

main()
