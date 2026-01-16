-- -----------------------------------------------------------------------------
-- ETAPA 1: ESTRUTURA DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- -----------------------------------------------------------------------------
-- Objetivo: Banco 100% relacional, chaves estrangeiras, sem JSON para regras.
-- -----------------------------------------------------------------------------

-- 1. VIGILANTES
-- Cadastro mestre de vigilantes.
CREATE TABLE vigilantes (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(15) UNIQUE NOT NULL,
    nome VARCHAR(60) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

-- 2. SETORES
-- Cadastro mestre de postos de trabalho.
CREATE TABLE setores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(60) NOT NULL,
    codigo_radio VARCHAR(10) NOT NULL,
    campus VARCHAR(30) NOT NULL,
    critico BOOLEAN DEFAULT FALSE -- Define se o posto não pode ficar descoberto
);

-- 3. JORNADAS
-- Tipos de escala (ex: 12x36, 5x2, etc).
CREATE TABLE jornadas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(10) NOT NULL -- Ex: "12x36", "SD"
);

-- 4. HORÁRIOS
-- Definição de horários de turno.
CREATE TABLE horarios (
    id SERIAL PRIMARY KEY,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL
);

-- 5. RELAÇÃO SETOR × JORNADA × HORÁRIO
-- Define quais configurações são válidas para cada setor.
CREATE TABLE setor_jornada (
    id SERIAL PRIMARY KEY,
    setor_id INT NOT NULL REFERENCES setores(id),
    jornada_id INT NOT NULL REFERENCES jornadas(id),
    horario_id INT NOT NULL REFERENCES horarios(id)
);

-- 6. ESCALA MENSAL
-- Header da escala. Controla o estado do mês.
CREATE TABLE escala_mensal (
    id SERIAL PRIMARY KEY,
    ano INT NOT NULL,
    mes INT NOT NULL,
    status VARCHAR(15) NOT NULL CHECK (status IN ('PROVISORIA', 'OFICIAL')),
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE(ano, mes) -- Garante apenas uma escala por mês/ano
);

-- 7. SETORES DA ESCALA (SNAPSHOT)
-- Quais setores estão ativos nesta escala específica.
CREATE TABLE escala_setores (
    id SERIAL PRIMARY KEY,
    escala_mensal_id INT NOT NULL REFERENCES escala_mensal(id) ON DELETE CASCADE,
    setor_jornada_id INT NOT NULL REFERENCES setor_jornada(id)
);

-- 8. ESCALA DIÁRIA / SIMULAÇÃO
-- A alocação real: Quem, Onde, Quando.
CREATE TABLE escala_vigilantes (
    id SERIAL PRIMARY KEY,
    escala_mensal_id INT NOT NULL REFERENCES escala_mensal(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    vigilante_id INT REFERENCES vigilantes(id), -- Pode ser NULL se estiver descoberto
    setor_jornada_id INT NOT NULL REFERENCES setor_jornada(id)
);

-- 9. SOLICITAÇÃO DE FOLGA
CREATE TABLE solicitacoes_folga (
    id SERIAL PRIMARY KEY,
    vigilante_id INT NOT NULL REFERENCES vigilantes(id),
    escala_mensal_id INT NOT NULL REFERENCES escala_mensal(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    status VARCHAR(15) CHECK (status IN ('PENDENTE', 'APROVADA', 'NEGADA')) DEFAULT 'PENDENTE'
);

-- 10. FÉRIAS
CREATE TABLE ferias (
    id SERIAL PRIMARY KEY,
    vigilante_id INT NOT NULL REFERENCES vigilantes(id),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    parcial BOOLEAN DEFAULT FALSE
);

-- 11. AFASTAMENTOS
CREATE TABLE afastamentos (
    id SERIAL PRIMARY KEY,
    vigilante_id INT NOT NULL REFERENCES vigilantes(id),
    motivo VARCHAR(30),
    data_inicio DATE,
    data_fim DATE
);

-- 12. INTERVALOS
CREATE TABLE intervalos (
    id SERIAL PRIMARY KEY,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL
);

-- 13. LOGS DE INTERVALO
-- Registro operacional diário de quem cobriu quem.
CREATE TABLE intervalos_log (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    setor_id INT NOT NULL REFERENCES setores(id),
    vigilante_intervalo_id INT REFERENCES vigilantes(id), -- Quem saiu pro intervalo
    vigilante_cobrindo_id INT REFERENCES vigilantes(id), -- Quem cobriu
    hora_inicio TIME,
    hora_fim TIME
);

-- 14. LOGS DO SISTEMA
CREATE TABLE logs_sistema (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(30),
    acao TEXT,
    data_hora TIMESTAMP DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- ÍNDICES DE PERFORMANCE (Recomendado para Foreign Keys)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_setor_jornada_setor ON setor_jornada(setor_id);
CREATE INDEX idx_setor_jornada_jornada ON setor_jornada(jornada_id);
CREATE INDEX idx_setor_jornada_horario ON setor_jornada(horario_id);

CREATE INDEX idx_escala_setores_escala ON escala_setores(escala_mensal_id);
CREATE INDEX idx_escala_setores_setor_jornada ON escala_setores(setor_jornada_id);

CREATE INDEX idx_escala_vigilantes_escala ON escala_vigilantes(escala_mensal_id);
CREATE INDEX idx_escala_vigilantes_vigilante ON escala_vigilantes(vigilante_id);
CREATE INDEX idx_escala_vigilantes_data ON escala_vigilantes(data);
CREATE INDEX idx_escala_vigilantes_setor_jornada ON escala_vigilantes(setor_jornada_id);

CREATE INDEX idx_solicitacoes_vigilante ON solicitacoes_folga(vigilante_id);
CREATE INDEX idx_solicitacoes_escala ON solicitacoes_folga(escala_mensal_id);

CREATE INDEX idx_ferias_vigilante ON ferias(vigilante_id);
CREATE INDEX idx_ferias_data ON ferias(data_inicio, data_fim);

CREATE INDEX idx_afastamentos_vigilante ON afastamentos(vigilante_id);
