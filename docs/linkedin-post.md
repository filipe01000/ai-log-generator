# Sugestão de post para LinkedIn

Hoje avancei no desenvolvimento do AI Log Generator, uma aplicação web para geração de logs sintéticos voltada para treinamento de SOC, Blue Team, DFIR, Threat Hunting e simulações de incidentes.

O projeto nasceu da necessidade de treinar leitura de logs, validação de parser e análise de eventos sem depender de dados reais sensíveis.

Nesta versão implementei:

- Dashboard operacional com métricas e gráficos
- Gerador de logs por fabricante, severidade, evento e formato
- Raw concentrado para leitura em estilo console SOC
- Parser automático para transformar log bruto em campos normalizados
- Análise com IA para apoiar triagem, ajuste de parser e recomendação de resposta
- Exportação em TXT, JSON, CSV, Syslog, CEF, LEEF, EVTX simulado e NDJSON
- Modo claro e escuro para apresentação, estudo e operação

A ideia principal é simular cenários realistas como brute force, ransomware, PowerShell suspeito, web attack, movimentação lateral e eventos benignos misturados com eventos maliciosos.

Fluxo de análise do projeto:

Raw log → Parser → Normalização → MITRE ATT&CK → Análise IA → Resposta recomendada

Esse projeto está me ajudando a evoluir na prática em engenharia de detecção, SIEM, investigação de logs e construção de ferramentas para segurança ofensiva e defensiva.

Tecnologias usadas:
Next.js, React, TypeScript, TailwindCSS, Prisma, SQLite, Recharts, Zod e integração opcional com OpenAI/Ollama.

Próximos passos:

- Melhorar qualidade dos templates por fabricante
- Adicionar cenários de campanha com múltiplos estágios
- Criar regras Sigma/YARA/SIEM a partir dos logs
- Implementar correlação entre eventos
- Expandir suporte para Wazuh, FortiSIEM, FortiGate, Sysmon e Windows Security

#cybersecurity #soc #blueteam #threathunting #dfir #siem #mitreattack #nextjs #typescript #homelab #cybersecuritylearning
