-- ==============================================================================
-- ARENA QUIZ GAMIFICADO - BANCO DE DADOS SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Tabela de Jogadores / Usuários
CREATE TABLE IF NOT EXISTS public.players (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  avatar_id TEXT DEFAULT 'fox',
  title_badge TEXT DEFAULT 'Competidor QR',
  total_score BIGINT DEFAULT 0,
  matches_played INT DEFAULT 0,
  wins_count INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Histórico de Partidas
CREATE TABLE IF NOT EXISTS public.match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT REFERENCES public.players(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  quiz_title TEXT NOT NULL,
  score INT NOT NULL,
  correct_count INT NOT NULL,
  total_questions INT NOT NULL,
  rank_position INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. View com a Posição Global dos Jogadores (DENSE_RANK por pontuação total)
CREATE OR REPLACE VIEW public.player_rankings AS
SELECT 
  id,
  nickname,
  avatar_id,
  title_badge,
  total_score,
  matches_played,
  wins_count,
  correct_answers,
  updated_at,
  DENSE_RANK() OVER (ORDER BY total_score DESC, wins_count DESC, correct_answers DESC) AS position
FROM public.players;

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso Público (anon key) para leitura e escrita
DROP POLICY IF EXISTS "Permitir leitura pública dos jogadores" ON public.players;
CREATE POLICY "Permitir leitura pública dos jogadores" 
  ON public.players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de jogadores" ON public.players;
CREATE POLICY "Permitir inserção de jogadores" 
  ON public.players FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de jogadores" ON public.players;
CREATE POLICY "Permitir atualização de jogadores" 
  ON public.players FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir leitura pública de pontuações" ON public.match_scores;
CREATE POLICY "Permitir leitura pública de pontuações" 
  ON public.match_scores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de pontuações" ON public.match_scores;
CREATE POLICY "Permitir inserção de pontuações" 
  ON public.match_scores FOR INSERT WITH CHECK (true);

-- 6. Inserir dados de exemplo para o ranking inicial (Opcional)
INSERT INTO public.players (id, nickname, avatar_id, title_badge, total_score, matches_played, wins_count, correct_answers)
VALUES
  ('bot-1', 'CyberNinja', 'ninja', 'Mestre dos Quizzes', 9450, 12, 8, 54),
  ('bot-2', 'AstralPulse', 'cat', 'Velocista Espacial', 8200, 10, 5, 48),
  ('bot-3', 'QuantumFox', 'fox', 'Estrategista Ágil', 7600, 9, 3, 41),
  ('bot-4', 'SolarSpark', 'bear', 'Explorador Solar', 6900, 8, 2, 36),
  ('bot-5', 'PixelPanda', 'panda', 'Guerreiro 8-bit', 5800, 7, 1, 30)
ON CONFLICT (id) DO NOTHING;
