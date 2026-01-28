-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS "EUZEREI!"
-- Copie este código e cole no SQL Editor do Supabase

-- 1. Criar a tabela de jogos
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('PC', 'PS5', 'Xbox', 'Switch', 'Outro')),
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 10),
    review TEXT,
    is_platinum BOOLEAN DEFAULT FALSE,
    hours_played INTEGER DEFAULT 0,
    background_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar o Row Level Security (RLS)
-- Isso impede que um usuário acesse os dados de outro
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- 3. Criar as Políticas de Segurança (RLS Policies)

-- Política: Usuários só podem ver seus próprios jogos
CREATE POLICY "Users can view own games" 
ON public.games FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Política: Usuários só podem inserir jogos para o seu próprio ID
CREATE POLICY "Users can insert own games" 
ON public.games FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem atualizar seus próprios jogos
CREATE POLICY "Users can update own games" 
ON public.games FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem deletar seus próprios jogos
CREATE POLICY "Users can delete own games" 
ON public.games FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Criar um índice para melhorar a performance das buscas por usuário
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);

-- 5. Dica: Se quiser que o nome do usuário/gamertag apareça corretamente, 
-- certifique-se de que está passando os metadados no momento do cadastro (Sign Up).