-- PASSO 1: Ajustar Schema do Banco (Compatibilidade Legacy)
-- Esse script adiciona colunas que o frontend antigo espera implicitamente ou facilita o mapeamento.

-- 1. Adicionar colunas de suporte legacy em VIGILANTES
-- Frontend antigo usa 'eq' (equipe) como propriedade direta, e também 'setor' fixo.
ALTER TABLE vigilantes
ADD COLUMN IF NOT EXISTS equipe_padrao VARCHAR(10),
ADD COLUMN IF NOT EXISTS setor_id_padrao INTEGER REFERENCES setores(id);

-- 2. Garantir existência de tabelas mencionadas no contexto "Legacy" que podem faltar
-- SOLICITACOES_FOLGA (chamada de 'requests' no JSON legacy)
CREATE TABLE IF NOT EXISTS solicitacoes_folga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vigilante_id UUID REFERENCES vigilantes(id) ON DELETE CASCADE,
    dia INTEGER NOT NULL, -- Dia do mês (legado) ou DATE? O JSON antigo usa { day: number }. Vamos usar DATE para ser relacional e converter.
    -- PERA: O JSON antigo usa "day: number". Se o mês mudar, o número perde sentido.
    -- Mas como é "Legacy Adapter", vamos armazenar a DATA real (DATE) e converter para número no Controller.
    data DATE NOT NULL, 
    opcao VARCHAR(1) CHECK (opcao IN ('A', 'B')),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    timestamp BIGINT, -- Para ordenar quem pediu primeiro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- FERIAS (Vacations) - Garante que existe
CREATE TABLE IF NOT EXISTS ferias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vigilante_id UUID REFERENCES vigilantes(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserts iniciais de compatibilidade (se necessário) ou deixamos vazio.
-- Nota: A migração de dados será feita via endpoint /api/migration/upload conforme pedido.
