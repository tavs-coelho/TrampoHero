# MANUAL DE CONFORMIDADE LGPD - TRAMPOHERO PRO

**Documento Interno de Governança de Dados Pessoais**

**Versão: 1.0**  
**Data: 11 de fevereiro de 2026**

---

## 📋 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Estrutura de Governança](#2-estrutura-de-governança)
3. [Mapeamento de Dados](#3-mapeamento-de-dados)
4. [Bases Legais](#4-bases-legais)
5. [Direitos dos Titulares](#5-direitos-dos-titulares)
6. [Segurança da Informação](#6-segurança-da-informação)
7. [Gestão de Incidentes](#7-gestão-de-incidentes)
8. [Relacionamento com Terceiros](#8-relacionamento-com-terceiros)
9. [Ciclo de Vida dos Dados](#9-ciclo-de-vida-dos-dados)
10. [Treinamento e Conscientização](#10-treinamento-e-conscientização)
11. [Auditoria e Monitoramento](#11-auditoria-e-monitoramento)
12. [Checklist de Conformidade](#12-checklist-de-conformidade)

---

## 1. VISÃO GERAL

### 1.1. Objetivo

Este documento estabelece diretrizes, processos e responsabilidades para garantir a conformidade do TrampoHero Pro com a **Lei Geral de Proteção de Dados** (Lei nº 13.709/2018).

### 1.2. Escopo

Aplica-se a:
- Todos os colaboradores do TrampoHero
- Prestadores de serviço e parceiros
- Todas as operações de tratamento de dados pessoais
- Dados de Freelancers, Empregadores e visitantes da Plataforma

### 1.3. Princípios da LGPD (Art. 6º)

O TrampoHero compromete-se a tratar dados pessoais seguindo os princípios:

| Princípio | Descrição | Como aplicamos |
|-----------|-----------|----------------|
| **Finalidade** | Propósitos legítimos, específicos e explícitos | Informamos claramente por que coletamos cada dado |
| **Adequação** | Compatibilidade com finalidades | Coletamos apenas dados necessários |
| **Necessidade** | Limitação ao mínimo necessário | Não coletamos dados excessivos |
| **Livre Acesso** | Garantia de consulta facilitada | Interface de acesso aos dados na Plataforma |
| **Qualidade dos Dados** | Exatidão, clareza e atualização | Permitimos edição e correção |
| **Transparência** | Informações claras e acessíveis | Política de Privacidade em linguagem simples |
| **Segurança** | Proteção contra acessos não autorizados | Criptografia, firewalls, controle de acesso |
| **Prevenção** | Medidas preventivas | Testes de segurança, auditorias, treinamentos |
| **Não Discriminação** | Sem fins discriminatórios ou abusivos | Vedação de uso para discriminação |
| **Responsabilização** | Demonstração de conformidade | Este documento e registros de conformidade |

---

## 2. ESTRUTURA DE GOVERNANÇA

### 2.1. Encarregado de Dados (DPO)

**Identificação:**
- **Nome**: João Silva Santos
- **Email**: dpo@trampohero.com.br
- **Telefone**: +55 11 3000-0001
- **Reporta-se a**: CEO

**Responsabilidades:**
- ✅ Aceitar reclamações e comunicações de titulares
- ✅ Prestar esclarecimentos sobre tratamento de dados
- ✅ Orientar colaboradores sobre boas práticas
- ✅ Interface com a ANPD
- ✅ Monitorar conformidade com LGPD
- ✅ Coordenar resposta a incidentes de segurança
- ✅ Revisar contratos com operadores
- ✅ Manter Registro de Atividades de Tratamento atualizado

### 2.2. Comitê de Privacidade

**Composição:**
- Encarregado de Dados (DPO) - Coordenador
- CTO (Chief Technology Officer)
- Gerente Jurídico
- Gerente de Segurança da Informação
- Representante de Produto

**Reuniões:**
- Frequência: Mensal
- Extraordinária: Em caso de incidentes graves

**Atribuições:**
- Definir políticas de privacidade
- Avaliar novos produtos/features sob ótica da LGPD
- Aprovar alterações em processos de tratamento
- Revisar Relatório de Impacto à Proteção de Dados (RIPD)

### 2.3. Responsabilidades por Área

**Desenvolvimento:**
- Implementar Privacy by Design
- Garantir segurança técnica
- Criptografar dados sensíveis
- Realizar testes de segurança

**Produto:**
- Incluir análise de privacidade em novas features
- Garantir minimização de dados
- Implementar controles de consentimento

**Jurídico:**
- Revisar Termos, Políticas e Contratos
- Analisar bases legais
- Responder a requisições judiciais

**Atendimento:**
- Processar solicitações de titulares
- Encaminhar questões ao DPO
- Registrar reclamações

---

## 3. MAPEAMENTO DE DADOS

### 3.1. Registro de Atividades de Tratamento (ROPA)

**Agentes de Tratamento:**
- **Controlador**: TrampoHero Inc. (CNPJ: 00.000.000/0001-00)
- **Operadores**: AWS, Google Cloud, Gemini API, Processadores de Pagamento

#### 3.1.1. Dados de Cadastro

| Dado | Categoria | Finalidade | Base Legal | Retenção |
|------|-----------|------------|------------|----------|
| Nome completo | Identificação | Criação de conta, Contrato | Execução de contrato | Enquanto ativo + 5 anos |
| CPF/CNPJ | Identificação | Validação, Fiscal | Obrigação legal | Enquanto ativo + 5 anos |
| Email | Contato | Comunicação, Login | Execução de contrato | Enquanto ativo + 1 ano |
| Telefone | Contato | Notificações, Suporte | Execução de contrato | Enquanto ativo + 1 ano |
| Data nascimento | Identificação | Validação idade | Legítimo interesse | Enquanto ativo |
| Endereço | Localização | Entrega, Fiscal | Execução de contrato | Enquanto ativo + 5 anos |
| Foto perfil | Identificação | Perfil público | Consentimento | Enquanto ativo + 30 dias |

#### 3.1.2. Dados Profissionais

| Dado | Categoria | Finalidade | Base Legal | Retenção |
|------|-----------|------------|------------|----------|
| Nicho/área atuação | Profissional | Matching vagas | Execução de contrato | Enquanto ativo |
| Habilidades | Profissional | Busca talentos | Execução de contrato | Enquanto ativo |
| Experiência | Profissional | Qualificação | Consentimento | Enquanto ativo |
| Avaliações | Reputação | Confiança, Qualidade | Legítimo interesse | 5 anos |
| Histórico trabalhos | Transacional | Análise, Disputa | Legítimo interesse | 5 anos |

#### 3.1.3. Dados Financeiros

| Dado | Categoria | Finalidade | Base Legal | Retenção |
|------|-----------|------------|------------|----------|
| Dados bancários | Financeiro | Pagamentos | Execução de contrato | Enquanto ativo + 5 anos |
| Transações | Financeiro | Histórico, Fiscal | Obrigação legal | 5 anos |
| Notas fiscais | Fiscal | Obrigação tributária | Obrigação legal | 5 anos |

#### 3.1.4. Dados de Geolocalização

| Dado | Categoria | Finalidade | Base Legal | Retenção |
|------|-----------|------------|------------|----------|
| GPS check-in/out | Localização precisa | Validação presença | Execução de contrato | 5 anos (prova) |
| Cidade/bairro | Localização aproximada | Busca vagas | Execução de contrato | Enquanto ativo |
| Raio busca | Preferência | Personalização | Consentimento | Enquanto ativo |

#### 3.1.5. Dados de Uso

| Dado | Categoria | Finalidade | Base Legal | Retenção |
|------|-----------|------------|------------|----------|
| Logs acesso | Técnico | Segurança, Debug | Legítimo interesse | 6 meses |
| IP | Técnico | Segurança, Fraude | Legítimo interesse | 6 meses |
| Cookies | Comportamental | Funcionalidade | Consentimento | Conforme tipo |
| Navegação | Comportamental | Analytics | Consentimento | Anonimizado após 2 anos |

### 3.2. Fluxo de Dados

```
[Usuário] → [Frontend Web] → [Backend API] → [Banco de Dados]
                ↓                  ↓               ↓
         [Local Storage]    [Gemini API]    [AWS S3 (Backups)]
                                ↓
                          [Processadores]
                          - Pagamentos
                          - Email
                          - SMS
```

### 3.3. Categorias de Titulares

1. **Freelancers**: Prestadores de serviço autônomos
2. **Empregadores**: Tomadores de serviço
3. **Visitantes**: Usuários não cadastrados
4. **Ex-usuários**: Contas canceladas (dados em retenção legal)

---

## 4. BASES LEGAIS

### 4.1. Fundamentação (Art. 7º e 11º LGPD)

Cada tratamento deve ter base legal justificada:

#### 4.1.1. Execução de Contrato (Art. 7º, V)

**Aplicação:**
- Dados necessários para prestação do serviço
- Matching de vagas e talentos
- Processamento de pagamentos
- Check-in/check-out GPS

**Exemplo**: Não podemos conectar Freelancer e Empregador sem nome, contato e localização.

#### 4.1.2. Consentimento (Art. 7º, I)

**Aplicação:**
- Marketing e newsletters
- Cookies não essenciais
- Dados opcionais (foto, portfólio)
- Compartilhamento com parceiros

**Requisitos:**
- ✅ Livre, informado e inequívoco
- ✅ Finalidade específica
- ✅ Destacado de outros termos
- ✅ Possibilidade de revogação facilitada

**Implementação:**
- Checkbox separado (não pré-marcado)
- Linguagem clara
- Botão "Gerenciar consentimentos" nas configurações

#### 4.1.3. Legítimo Interesse (Art. 7º, IX)

**Aplicação:**
- Segurança da Plataforma
- Prevenção de fraudes
- Analytics para melhorias
- Sistema de avaliações

**Teste de Legítimo Interesse (LIA):**

1. **Teste de Propósito**: Finalidade é legítima?
2. **Teste de Necessidade**: É necessário para a finalidade?
3. **Teste de Balanceamento**: Interesses não sobrepõem direitos do titular?
4. **Salvaguardas**: Medidas para proteger direitos?

**Documentação**: Mantemos Legitimate Interest Assessment (LIA) para cada caso.

#### 4.1.4. Obrigação Legal (Art. 7º, II)

**Aplicação:**
- Retenção de dados fiscais (5 anos)
- Atendimento a ordem judicial
- Compliance tributário (emissão de NF)

**Exemplo**: Lei nº 8.846/94 exige manutenção de documentos fiscais por 5 anos.

#### 4.1.5. Proteção da Vida (Art. 7º, VII)

**Aplicação:**
- Emergências médicas durante trabalho
- Acidentes reportados na Plataforma

#### 4.1.6. Tutela da Saúde (Art. 7º, VIII)

**Aplicação:**
- Seguro TrampoProtect (dados de saúde se aplicável)
- **Requer consentimento específico para dados sensíveis**

### 4.2. Dados Sensíveis (Art. 11)

**Definição LGPD:**
- Origem racial ou étnica
- Convicção religiosa
- Opinião política
- Filiação sindical
- Dados genéticos/biométricos
- Dados sobre saúde ou vida sexual

**Nossa Política:**
- ❌ **NÃO coletamos dados sensíveis** rotineiramente
- ⚠️ **Exceção**: Seguro saúde (TrampoProtect) - requer consentimento específico e destacado
- ✅ Vedação de discriminação por dados sensíveis

---

## 5. DIREITOS DOS TITULARES

### 5.1. Catálogo de Direitos (Art. 18)

| Direito | Descrição | Como Exercer | Prazo Resposta |
|---------|-----------|--------------|----------------|
| **Confirmação** | Saber se tratamos seus dados | dpo@trampohero.com.br ou Config. | 15 dias |
| **Acesso** | Ver quais dados tratamos | Baixar dados nas Config. | Imediato/15 dias |
| **Correção** | Corrigir dados incorretos | Editar nas Config. | Imediato |
| **Anonimização** | Tornar dados anônimos | dpo@trampohero.com.br | 15 dias |
| **Bloqueio** | Suspender tratamento | dpo@trampohero.com.br | 15 dias |
| **Eliminação** | Excluir dados | "Excluir conta" ou DPO | 30 dias |
| **Portabilidade** | Receber dados (JSON/CSV) | dpo@trampohero.com.br | 15 dias |
| **Informação** | Saber com quem compartilhamos | Política Privacidade ou DPO | 15 dias |
| **Revogação** | Retirar consentimento | Config. > Privacidade | Imediato |

### 5.2. Processo de Atendimento

**Fluxo:**

```
1. Titular solicita → 2. Validação identidade → 3. DPO analisa → 4. Execução → 5. Resposta
```

**Validação de Identidade:**
- Login na conta (para usuários ativos)
- Email + código enviado (para ex-usuários)
- Documentação adicional se necessário (RG, CPF)

**Exceções à Exclusão:**
- Dados em obrigação legal (5 anos fiscais)
- Dados em litígio pendente
- Dados anonimizados para estatísticas

### 5.3. Ferramentas Self-Service

**Implementado na Plataforma:**

- ✅ **Baixar meus dados**: Exportação JSON completo
- ✅ **Editar perfil**: Correção de dados
- ✅ **Gerenciar consentimentos**: Checkboxes individuais
- ✅ **Excluir conta**: Formulário com confirmação
- ✅ **Histórico de acessos**: Log de logins

---

## 6. SEGURANÇA DA INFORMAÇÃO

### 6.1. Medidas Técnicas

#### 6.1.1. Criptografia

**Em Trânsito:**
- ✅ TLS 1.3 para todas as comunicações HTTPS
- ✅ Certificado SSL válido

**Em Repouso:**
- ✅ Senhas: bcrypt (hash + salt)
- ✅ Dados bancários: AES-256
- ✅ Dados sensíveis: Criptografia de campo

**Chaves:**
- Gerenciamento via AWS KMS (Key Management Service)
- Rotação automática trimestral
- Separação de chaves por ambiente (dev/prod)

#### 6.1.2. Controle de Acesso

**Autenticação:**
- ✅ Senha forte (mín. 8 caracteres, maiúscula, número, símbolo)
- ✅ 2FA opcional (autenticação de dois fatores)
- ✅ Timeout de sessão: 30 min inatividade

**Autorização:**
- ✅ Least Privilege (mínimo privilégio necessário)
- ✅ RBAC (Role-Based Access Control)
- ✅ Logs de acesso administrativo

**Acesso Interno:**
- Apenas colaboradores autorizados (need-to-know)
- VPN obrigatória para acessos remotos
- Revisão trimestral de permissões

#### 6.1.3. Infraestrutura

**Servidores:**
- ✅ AWS com conformidade ISO 27001, SOC 2
- ✅ Firewall configurado
- ✅ Patches de segurança automáticos
- ✅ Segregação de ambientes (dev/staging/prod)

**Banco de Dados:**
- ✅ Backups diários automáticos (retenção 30 dias)
- ✅ Backup semanal arquivado (retenção 1 ano)
- ✅ Réplicas em múltiplas zonas
- ✅ Point-in-time recovery

**Monitoramento:**
- ✅ IDS/IPS (Intrusion Detection/Prevention System)
- ✅ SIEM para análise de logs
- ✅ Alertas automáticos de anomalias

#### 6.1.4. Desenvolvimento Seguro

**Práticas:**
- ✅ Code review obrigatório
- ✅ Testes de segurança automatizados (SAST)
- ✅ Verificação de dependências vulneráveis (Snyk, Dependabot)
- ✅ Sanitização de inputs (prevenção SQL injection, XSS)
- ✅ Rate limiting (prevenção DDoS)

### 6.2. Medidas Organizacionais

**Políticas:**
- ✅ Política de Segurança da Informação
- ✅ Política de Senhas
- ✅ Política de Backup e Recuperação
- ✅ Política de Clean Desk / Clear Screen
- ✅ Política de BYOD (Bring Your Own Device)

**Contratos:**
- ✅ NDA (Non-Disclosure Agreement) com todos colaboradores
- ✅ Cláusulas de confidencialidade em contratos
- ✅ Termos de Uso de Recursos de TI

**Conscientização:**
- ✅ Treinamento de segurança anual obrigatório
- ✅ Simulações de phishing trimestrais
- ✅ Guia de boas práticas de segurança

### 6.3. Testes e Auditorias

**Testes de Segurança:**
- ✅ Pentest (teste de penetração) semestral
- ✅ Vulnerability assessment trimestral
- ✅ Testes de recuperação de desastres anual

**Auditorias:**
- ✅ Auditoria interna de conformidade LGPD anual
- ✅ Revisão de logs de acesso mensal
- ✅ Auditoria de terceiros (opcional) bianual

---

## 7. GESTÃO DE INCIDENTES

### 7.1. Definição de Incidente

**Incidente de Segurança da Informação:**
- Acesso não autorizado a dados pessoais
- Vazamento (data breach)
- Perda acidental de dados
- Ransomware ou malware
- Destruição não autorizada

### 7.2. Classificação de Severidade

| Nível | Descrição | Exemplos | Ação |
|-------|-----------|----------|------|
| **Crítico** | Alto risco aos direitos dos titulares | Vazamento CPF, dados bancários | Notificar ANPD + Titulares |
| **Alto** | Risco moderado, dados sensíveis expostos | Vazamento emails, telefones | Notificar ANPD |
| **Médio** | Risco baixo, dados pouco sensíveis | Vazamento logs anonimizados | Análise interna |
| **Baixo** | Sem risco real | Tentativa bloqueada | Log para análise |

### 7.3. Plano de Resposta a Incidentes

**Fase 1: Detecção e Acionamento (0-1h)**

1. Identificação do incidente
2. Acionamento do DPO e Comitê de Crise
3. Isolamento imediato (contenção)

**Fase 2: Avaliação (1-4h)**

4. Análise de impacto (quantos afetados, quais dados)
5. Classificação de severidade
6. Decisão sobre notificação

**Fase 3: Contenção e Erradicação (4-24h)**

7. Bloquear vetor de ataque
8. Remover vulnerabilidade
9. Restaurar dados de backup se necessário

**Fase 4: Notificação (até 72h após descoberta)**

10. **ANPD**: Se risco relevante (Art. 48 LGPD)
    - Via sistema da ANPD
    - Informações: data, dados afetados, medidas tomadas
11. **Titulares**: Se alto risco (Art. 48, §1º)
    - Email individual ou comunicado público
    - Linguagem clara e acessível

**Fase 5: Recuperação e Lições Aprendidas (após contenção)**

12. Post-mortem analysis
13. Atualização de políticas e controles
14. Relatório final ao Comitê de Privacidade

### 7.4. Comunicação de Incidentes

**Template de Notificação aos Titulares:**

```
Assunto: Importante: Comunicado sobre Segurança de Dados

Prezado(a) [Nome],

Informamos que em [data] detectamos um incidente de segurança que 
pode ter afetado seus dados pessoais no TrampoHero.

DADOS AFETADOS: [listar dados]
CAUSA: [descrição breve]
MEDIDAS TOMADAS: [ações de contenção]
RISCO: [avaliação de risco]

O QUE FAZER:
- [Orientações específicas, ex: trocar senha]

Estamos à disposição para esclarecimentos.

Atenciosamente,
Encarregado de Dados
dpo@trampohero.com.br
```

### 7.5. Registro de Incidentes

**Documentação Obrigatória:**
- Data e hora da descoberta
- Descrição do incidente
- Dados afetados e quantidade de titulares
- Causa raiz identificada
- Medidas de contenção
- Notificações realizadas
- Lições aprendidas

**Ferramenta**: Sistema de tickets com tag "Incidente-LGPD"

---

## 8. RELACIONAMENTO COM TERCEIROS

### 8.1. Operadores de Dados

**Definição LGPD:**
- Terceiros que tratam dados em nome do TrampoHero
- Seguem instruções do Controlador (TrampoHero)

**Nossos Operadores:**
1. AWS (armazenamento cloud)
2. Google Cloud (backups, analytics)
3. Gemini API (processamento IA)
4. Processadores de pagamento
5. Provedores de email/SMS

### 8.2. Cláusulas Contratuais Obrigatórias

Todo contrato com Operador deve incluir:

**Cláusulas de Proteção de Dados:**

```
CLÁUSULA DE PROTEÇÃO DE DADOS PESSOAIS

1. DEFINIÇÕES
   Controlador: TrampoHero Inc.
   Operador: [Nome do Prestador]
   
2. OBRIGAÇÕES DO OPERADOR
   a) Tratar dados APENAS conforme instruções documentadas do Controlador
   b) Garantir confidencialidade dos agentes de tratamento
   c) Implementar medidas de segurança adequadas
   d) Não subcontratar sem autorização prévia e escrita
   e) Auxiliar o Controlador no atendimento a direitos dos titulares
   f) Eliminar/devolver dados ao término do contrato
   g) Notificar incidentes em até 24h
   
3. AUDITORIA
   O Controlador pode auditar conformidade do Operador mediante aviso 
   prévio de 15 dias.
   
4. RESPONSABILIDADE
   O Operador responde por danos causados por violação da LGPD decorrente 
   de seu tratamento.
   
5. TRANSFERÊNCIA INTERNACIONAL
   [Se aplicável] Dados podem ser transferidos para [países], garantindo 
   nível adequado de proteção.
```

### 8.3. Avaliação de Terceiros (Vendor Assessment)

**Checklist antes de contratar:**

- [ ] Possui Política de Privacidade conforme LGPD?
- [ ] Possui certificações de segurança (ISO 27001, SOC 2)?
- [ ] Aceita cláusulas de proteção de dados?
- [ ] Onde armazena dados (país/região)?
- [ ] Possui seguro cyber?
- [ ] Qual o histórico de incidentes?
- [ ] Permite auditoria?
- [ ] Possui suboperadores? (listar)

**Reavaliação**: Anual ou quando houver alteração significativa

### 8.4. Suboperadores

**Política:**
- Autorização prévia e específica do TrampoHero
- Mesmas obrigações do Operador principal
- Lista atualizada publicada na Política de Privacidade

---

## 9. CICLO DE VIDA DOS DADOS

### 9.1. Coleta

**Princípios:**
- ✅ Minimização: Coletar apenas o necessário
- ✅ Transparência: Informar finalidade no momento da coleta
- ✅ Consentimento: Quando aplicável, obter antes da coleta

**Formulários de Coleta:**
- Indicar campos obrigatórios vs. opcionais
- Aviso de privacidade visível
- Link para Política de Privacidade completa

### 9.2. Armazenamento

**Organização:**
- Dados em produção: Banco de dados principal (AWS RDS)
- Backups: S3 buckets com versionamento
- Logs: CloudWatch (retenção 6 meses)

**Acesso:**
- Criptografia em repouso
- Controle de acesso baseado em função
- Logs de acesso para auditoria

### 9.3. Uso

**Conformidade:**
- Uso apenas para finalidades informadas
- Proibição de uso secundário sem consentimento
- Anonimização para analytics quando possível

### 9.4. Compartilhamento

**Regras:**
- Apenas com base legal adequada
- Contratos com cláusulas de proteção
- Transparência na Política de Privacidade

### 9.5. Retenção

**Política de Retenção:**

| Categoria de Dados | Período | Justificativa |
|--------------------|---------|---------------|
| Cadastro ativo | Enquanto ativo | Execução contrato |
| Cadastro inativo | 1 ano | Possível reativação |
| Dados fiscais | 5 anos | Obrigação legal |
| Logs de acesso | 6 meses | Segurança |
| Avaliações | 5 anos | Confiança plataforma |
| GPS check-in/out | 5 anos | Prova contratual |
| Mensagens | 2 anos | Disputa eventual |

**Revisão**: Trimestral, com deleção automática de dados expirados

### 9.6. Eliminação

**Métodos:**
- **Deleção lógica**: Flag "deleted" (para dados em retenção legal)
- **Deleção física**: Remoção permanente do banco
- **Anonimização**: Remoção de identificadores (alternativa à deleção)

**Processo:**
1. Identificação de dados a eliminar (query automatizada)
2. Verificação de obrigações legais
3. Backup final antes de eliminação
4. Eliminação segura (não recuperável)
5. Log de eliminação

**Ferramentas:**
- Script automatizado semanal
- Validação manual pelo DPO mensal

---

## 10. TREINAMENTO E CONSCIENTIZAÇÃO

### 10.1. Programa de Treinamento

**Público-Alvo:**
- Todos os colaboradores (obrigatório)
- Prestadores de serviço com acesso a dados
- Novos funcionários (onboarding)

**Conteúdo:**
- Princípios da LGPD
- Direitos dos titulares
- Boas práticas de segurança
- Como identificar e reportar incidentes
- Responsabilidades específicas por função

**Formato:**
- EAD (módulos online) - 2h
- Avaliação final (aprovação mín. 70%)
- Certificado de conclusão

**Frequência:**
- Inicial: Onboarding
- Reciclagem: Anual
- Extraordinário: Após incidentes graves ou mudanças legais

### 10.2. Materiais de Conscientização

**Disponíveis:**
- ✅ Guia Rápido de LGPD (PDF 2 páginas)
- ✅ Cartaz "10 Dicas de Segurança"
- ✅ Email mensal "LGPD em Foco"
- ✅ Quiz gamificado trimestral

### 10.3. Responsabilidades Específicas

**Desenvolvedores:**
- Privacy by Design em novas features
- Não logar dados sensíveis
- Sanitizar inputs
- Criptografar dados em trânsito e repouso

**Atendimento:**
- Identificar solicitações de titulares
- Escalar para DPO quando necessário
- Não compartilhar dados sem validação de identidade

**Marketing:**
- Não usar dados sem consentimento
- Respeitar opt-outs
- Segmentar comunicações conforme preferências

---

## 11. AUDITORIA E MONITORAMENTO

### 11.1. Auditoria Interna

**Frequência**: Anual

**Escopo:**
- Conformidade com LGPD e políticas internas
- Efetividade de controles de segurança
- Atendimento a direitos dos titulares
- Contratos com operadores
- Registro de Atividades de Tratamento atualizado

**Responsável**: DPO + Auditoria Interna

**Entregável**: Relatório com achados e plano de ação

### 11.2. Auditoria Externa (Opcional)

**Frequência**: Bianual ou sob demanda

**Escopo:**
- Certificação ISO 27001 (gestão segurança informação)
- Pentest (teste penetração)
- Compliance LGPD por consultoria especializada

### 11.3. Indicadores de Desempenho (KPIs)

**Monitoramento Mensal:**

| KPI | Meta | Medição |
|-----|------|---------|
| Tempo médio resposta a solicitações titulares | ≤ 10 dias | Média mensal |
| % solicitações atendidas no prazo (15 dias) | ≥ 95% | Mensal |
| Incidentes de segurança | 0 críticos | Mensal |
| Tempo médio contenção incidente | ≤ 4h | Por incidente |
| % colaboradores treinados | 100% | Trimestral |
| Vulnerabilidades críticas não corrigidas | 0 | Mensal |

**Dashboard**: Ferramenta de BI com visualização em tempo real

### 11.4. Revisão de Políticas

**Política de Privacidade:**
- Revisão: Anual ou quando houver mudança legal/operacional
- Aprovação: Comitê de Privacidade + Jurídico
- Comunicação: 30 dias antes de mudanças substanciais

**Políticas Internas:**
- Revisão: Anual
- Aprovação: DPO
- Distribuição: Intranet + email institucional

---

## 12. CHECKLIST DE CONFORMIDADE

### 12.1. Checklist Geral LGPD

**Governança:**
- [x] DPO nomeado e divulgado
- [x] Comitê de Privacidade ativo
- [x] Políticas de privacidade publicadas
- [x] Termos de Uso atualizados

**Mapeamento:**
- [x] Registro de Atividades de Tratamento (ROPA)
- [x] Inventário de dados pessoais
- [x] Fluxo de dados documentado
- [x] Bases legais identificadas

**Direitos dos Titulares:**
- [x] Canais de atendimento (DPO)
- [x] Processo de atendimento documentado
- [x] Ferramentas self-service (baixar dados, excluir conta)
- [x] SLA de 15 dias

**Segurança:**
- [x] Criptografia (em trânsito e repouso)
- [x] Controle de acesso implementado
- [x] Backups automáticos
- [x] Plano de Resposta a Incidentes
- [x] Testes de segurança periódicos

**Terceiros:**
- [x] Contratos com cláusulas LGPD
- [x] Avaliação de operadores
- [x] Lista de suboperadores divulgada

**Transparência:**
- [x] Política de Privacidade acessível
- [x] Avisos de privacidade em formulários
- [x] Gestão de consentimentos

**Treinamento:**
- [x] Programa de treinamento LGPD
- [x] Materiais de conscientização

**Monitoramento:**
- [x] Auditoria interna anual
- [x] KPIs de privacidade
- [x] Logs de acesso

### 12.2. Checklist Privacy by Design

Para cada nova feature, verificar:

- [ ] **Proativo não reativo**: Medidas preventivas implementadas?
- [ ] **Privacidade como padrão**: Configurações mais restritivas por padrão?
- [ ] **Privacidade incorporada**: Não é add-on, é built-in?
- [ ] **Funcionalidade total**: Não é trade-off, é win-win?
- [ ] **Segurança ponta a ponta**: Proteção em todo ciclo de vida?
- [ ] **Visibilidade e transparência**: Usuário sabe o que acontece com dados?
- [ ] **Respeito à privacidade**: Interesses do usuário priorizados?

### 12.3. Checklist Avaliação de Impacto (RIPD)

**Quando fazer RIPD:**
- Tratamento em larga escala de dados sensíveis
- Decisões automatizadas com impacto significativo
- Monitoramento sistemático de áreas públicas
- Transferência internacional de dados
- Uso de novas tecnologias

**Elementos do RIPD:**
- [ ] Descrição do tratamento
- [ ] Necessidade e proporcionalidade
- [ ] Riscos aos titulares
- [ ] Medidas de mitigação
- [ ] Aprovação do DPO

---

## 13. CONTATO E REFERÊNCIAS

### 13.1. Contatos Internos

**DPO (Encarregado de Dados):**
- Email: dpo@trampohero.com.br
- Telefone: +55 11 3000-0001

**Comitê de Privacidade:**
- Email: privacidade@trampohero.com.br

**Segurança da Informação:**
- Email: security@trampohero.com.br

### 13.2. Referências Legais

- **LGPD**: Lei nº 13.709/2018
- **Marco Civil**: Lei nº 12.965/2014
- **CDC**: Lei nº 8.078/1990
- **ANPD**: https://www.gov.br/anpd/

### 13.3. Versão do Documento

**Versão**: 1.0  
**Data**: 11 de fevereiro de 2026  
**Próxima Revisão**: 11 de fevereiro de 2027  
**Aprovado por**: Comitê de Privacidade

---

## ANEXOS

### Anexo A: Modelo de Consentimento

```
☐ Li e aceito a Política de Privacidade

☐ Concordo em receber comunicações de marketing (newsletters, promoções)

☐ Concordo com uso de cookies analíticos para melhorar minha experiência

☐ Concordo em compartilhar meu perfil com parceiros do TrampoHero para 
   ofertas de cursos e benefícios

Você pode revogar esses consentimentos a qualquer momento em 
Configurações > Privacidade.
```

### Anexo B: Template de Contrato com Operadores

_(Arquivo separado: CONTRATO_OPERADOR_TEMPLATE.docx)_

### Anexo C: Formulário de Solicitação de Titular

_(Arquivo separado: FORMULARIO_SOLICITACAO_TITULAR.pdf)_

### Anexo D: Plano de Resposta a Incidentes Detalhado

_(Arquivo separado: PLANO_RESPOSTA_INCIDENTES.pdf)_

---

**TrampoHero Pro**  
*Compromisso com Privacidade e Conformidade*

© 2026 TrampoHero Inc. - Documento Confidencial  
Uso Interno e Operadores Autorizados
