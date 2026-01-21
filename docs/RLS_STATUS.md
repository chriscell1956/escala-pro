# Status de Segurança (RLS - Row Level Security)

**Status Atual**: DESATIVADO 🔴

## Contexto
Durante a fase de estabilização do sistema (Jan 2026), o RLS (Row Level Security) do Supabase foi mantido desativado para facilitar o desenvolvimento e a migração de dados legados.

## Riscos
- Atualmente, qualquer cliente autenticado com a chave pública (`anon` ou `service_role` usada no backend) pode tecnicamente acessar tabelas se não houver middleware de proteção.
- O Backend atual atua como proxy, mas requisições diretas ao Supabase ainda são possíveis se a chave anon for exposta no frontend.

## Ação Necessária (Backlog)
- [ ] Ativar RLS em todas as tabelas (`vigilantes`, `alocacoes`, `setores`, `usuarios`).
- [ ] Criar Policies de Leitura/Escrita para o role `authenticated`.
- [ ] Implementar regras específicas:
    - `USER`: Apenas leitura (exceto própria senha).
    - `FISCAL`: Leitura de todos, Escrita na própria equipe.
    - `MASTER`: Acesso total.

**Não bloquear o uso atual, mas priorizar antes do Go-Live público.**
