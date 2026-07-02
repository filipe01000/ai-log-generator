# AI Log Generator

Plataforma web profissional para geração de logs sintéticos realistas com foco em SOC, Blue Team, DFIR, Threat Hunting, Pentest, CTFs, laboratórios e simulações de incidentes.

O projeto substitui a ideia inicial em Shell Script por uma arquitetura web moderna com Next.js, React, TypeScript, TailwindCSS, shadcn/ui-style components, Prisma, SQLite e integração opcional com OpenAI API ou Ollama local.

## Objetivo

Gerar datasets de logs sintéticos para treinamento e engenharia de detecção sem usar dados reais sensíveis. O sistema mistura eventos benignos e maliciosos, inclui mapeamento MITRE ATT&CK e exporta em múltiplos formatos aceitos por fluxos de SOC/SIEM.

## Screenshots

### Dashboard em modo escuro

![Dashboard Dark](docs/screenshots/dashboard-dark.png)

### Dashboard em modo claro

![Dashboard Light](docs/screenshots/dashboard-light.png)

### Gerador de logs

![Log Generator](docs/screenshots/log-generator.png)

### Logs gerados, Parser e Análise com IA

![Logs Parser AI](docs/screenshots/logs-parser-ai.png)

### Configurações de tema

![Theme Settings](docs/screenshots/settings-theme.png)

## Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- TailwindCSS
- shadcn/ui-style components locais
- React Hook Form
- Zod
- Recharts

### Backend

- Next.js Route Handlers em `/app/api`
- APIs REST
- Arquitetura modular em `/lib`
- Validação com Zod
- Rate limit básico em memória

### Banco de dados

- SQLite para MVP
- Prisma ORM
- PostgreSQL preparado para produção trocando `DATABASE_URL` e provider no schema

### IA

- Modo mock/híbrido funcional por padrão
- OpenAI API opcional
- Ollama local opcional
- Estratégia: templates + geração sintética + IA para cenário

## Funcionalidades entregues

- Dashboard com métricas, fabricantes, severidades, MITRE e eventos recentes
- Gerador de logs por fabricante, evento, severidade, volume e ruído benigno
- AI Scenario Builder
- Linha do tempo do cenário
- IOCs fictícios
- TTPs com MITRE ATT&CK
- Logs coerentes misturando benigno e malicioso
- Tela de logs gerados com filtros
- Visualização raw e JSON formatado
- Copiar log para clipboard
- Exportação em TXT, JSON, CSV, Syslog, CEF, LEEF, EVTX simulado e NDJSON
- Presets de simulação
- Página MITRE ATT&CK
- Settings com status dos providers de IA

## Fabricantes e sistemas suportados no MVP

- FortiGate
- FortiSIEM
- Wazuh
- Sysmon
- Windows Security
- Active Directory
- Linux Auditd
- Apache
- Nginx
- SSH
- VPN
- DNS
- DHCP
- Firewall
- Suricata
- Zeek
- pfSense
- Cisco ASA
- Cisco IOS
- Mikrotik
- AWS CloudTrail
- Azure
- Microsoft Defender
- Office 365
- Exchange
- Kubernetes
- Docker
- PostgreSQL
- MySQL

## Eventos suportados

Inclui logon, logoff, falha de autenticação, movimentação lateral, RDP, PowerShell, CMD, Linux Bash, criação de processos, execução remota, criação de usuários, alteração de grupos, dump de credenciais, Mimikatz, Pass-the-Hash, Kerberoasting, Golden Ticket, DNS Tunneling, Beacon C2, Reverse Shell, Web Shell, SQL Injection, XSS, Directory Traversal, Brute Force, Nmap, Masscan, Hydra, ransomware, exfiltração, malware, botnet, APT e insider threat.

## Estrutura de pastas

```text
/app
  /dashboard
  /generate
  /ai-builder
  /attacks
  /mitre
  /exports
  /settings
  /logs
  /api
    /generate
    /export
    /ai-scenario
    /dashboard
    /logs
    /mitre
/components
  /ui
  /charts
  /forms
  /tables
  /layout
  /dashboard
  /attacks
/lib
  ai.ts
  generators.ts
  exporters.ts
  mitre.ts
  validators.ts
  utils.ts
  prisma.ts
  rate-limit.ts
  security.ts
  constants.ts
/data
  /templates
  /mitre
  /samples
/prisma
  schema.prisma
  seed.ts
```

## Instalação local

Requisitos:

- Node.js 20 ou superior recomendado
- npm

Passos:

```bash
cp .env.example .env
npm install
npm run dev
```

Acesse:

```text
http://localhost:3000
```

O comando `npm run dev` executa automaticamente:

```bash
prisma generate
prisma db push
tsx prisma/seed.ts
next dev
```

## Configurar OpenAI API

Edite `.env`:

```env
OPENAI_API_KEY="sua_chave"
OPENAI_MODEL="gpt-4.1-mini"
AI_PROVIDER="openai"
```

Na tela AI Scenario Builder, selecione `OpenAI API`.

Sem chave, o sistema continua funcionando usando o provider `mock`, que combina templates locais e geração sintética.

## Configurar Ollama local

Instale e suba o Ollama localmente. Depois edite `.env`:

```env
OLLAMA_URL="http://localhost:11434/api/generate"
OLLAMA_MODEL="llama3.1"
AI_PROVIDER="ollama"
```

Na tela AI Scenario Builder, selecione `Ollama local`.

## APIs REST

### Gerar logs

```http
POST /api/generate
Content-Type: application/json
```

```json
{
  "vendor": "FortiGate",
  "eventType": "Brute Force",
  "count": 100,
  "severity": "high",
  "noiseLevel": 25,
  "simulationMode": "SOC",
  "outputFormat": "json",
  "useAI": false
}
```

### Criar cenário com IA

```http
POST /api/ai-scenario
Content-Type: application/json
```

```json
{
  "companyType": "Empresa média",
  "assetCount": 120,
  "userCount": 450,
  "attackType": "Ransomware",
  "durationHours": 8,
  "noiseLevel": 35,
  "severity": "critical",
  "vendors": ["FortiGate", "Windows Security", "Sysmon", "Wazuh"],
  "outputFormat": "json",
  "logCount": 180,
  "aiProvider": "mock"
}
```

### Buscar logs

```http
GET /api/logs?vendor=FortiGate&severity=high&mitreId=T1110&take=100
```

### Exportar logs

```http
POST /api/export
Content-Type: application/json
```

```json
{
  "format": "cef",
  "vendor": "FortiGate",
  "severity": "high",
  "limit": 1000
}
```

### Dashboard

```http
GET /api/dashboard
```

## Segurança e uso responsável

- Todos os logs são sintéticos.
- Não insira dados reais sensíveis.
- A aplicação exibe aviso educacional.
- Entradas são validadas com Zod.
- Campos textuais são sanitizados.
- Há rate limit básico por IP.
- O objetivo é treinamento defensivo, laboratório, CTF e engenharia de detecção.

## Caminho para produção

Para produção, a recomendação é:

1. Trocar SQLite por PostgreSQL.
2. Adicionar autenticação.
3. Persistir rate limit em Redis.
4. Implementar filas para geração massiva.
5. Adicionar RBAC.
6. Separar worker de geração.
7. Adicionar storage para exports grandes.
8. Versionar templates por fabricante.
9. Adicionar testes automatizados.
10. Adicionar Dockerfile e docker-compose.

## PostgreSQL

Exemplo de `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai_log_generator"
```

Depois ajuste `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Execute:

```bash
npx prisma migrate dev
npm run dev
```

## Licença

Projeto educacional para laboratório, portfólio e treinamento de segurança.

## Melhorias adicionadas na tela de Logs

A tela `Logs Gerados` agora possui quatro modos de visualização:

1. `Raw concentrado`
   - Mostra todos os logs filtrados em um console único.
   - Exibe número da linha, fabricante, severidade e raw completo.
   - Possui agrupamento por timeline, fabricante ou criticidade.
   - Permite busca dentro do raw e copiar tudo para clipboard.

2. `Parser`
   - Faz parsing do raw log em tempo real.
   - Detecta JSON, key-value, web access log, Zeek TSV e texto simples.
   - Normaliza campos importantes para SOC, como origem, destino, porta, usuário, host, processo, comando e MITRE.
   - Mostra campos extraídos e observações de qualidade do parser.

3. `IA`
   - Analisa um log selecionado.
   - Funciona em modo mock local sem chave externa.
   - Pode usar OpenAI com `OPENAI_API_KEY`.
   - Pode usar Ollama local com `OLLAMA_URL` e `OLLAMA_ANALYSIS_MODEL`.
   - Retorna veredito, severidade, confiança, risco, evidências, ajustes de parser, correções e resposta recomendada.

4. `Tabela`
   - Mantém a visualização tradicional com filtros e raw individual.

### Variáveis opcionais para IA

```env
OPENAI_API_KEY="sua-chave"
OPENAI_MODEL="gpt-4.1-mini"
OPENAI_ANALYSIS_MODEL="gpt-4.1-mini"

OLLAMA_URL="http://localhost:11434/api/generate"
OLLAMA_MODEL="llama3.1"
OLLAMA_ANALYSIS_MODEL="llama3.1"
```

### Endpoint novo

```http
POST /api/ai-analysis
```

Payload mínimo:

```json
{
  "provider": "mock",
  "objective": "Analise o log como SOC N1/N2 e sugira ajustes de parser.",
  "logs": [
    {
      "vendor": "FortiGate",
      "eventType": "Brute Force",
      "severity": "high",
      "raw": "date=2026-07-02 time=10:00:00 srcip=10.0.0.5 dstip=8.8.8.8 action=blocked mitreid=T1110"
    }
  ]
}
```


## Novidades da versão 3

- Modo claro e escuro com persistência em `localStorage`.
- Botão de alternância no topo da aplicação.
- Tela de Settings com escolha entre Claro, Escuro e Sistema.
- Raw concentrado em estilo console SOC.
- Visualização Parser para campos normalizados.
- Aba IA para análise, ajustes de parser, severidade, evidências e resposta recomendada.
- Documentos auxiliares em `docs/linkedin-post.md` e `docs/github-publish.md`.
