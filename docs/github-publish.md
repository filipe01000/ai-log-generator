# Publicar no GitHub

## 1. Criar repositório

Nome recomendado:

```text
ai-log-generator
```

Descrição curta:

```text
AI-powered synthetic log generator for SOC, Blue Team, DFIR, Threat Hunting and detection engineering labs.
```

Tópicos recomendados:

```text
soc blue-team dfir threat-hunting siem mitre-attack cybersecurity nextjs typescript prisma openai detection-engineering
```

## 2. Inicializar Git localmente

Dentro da pasta do projeto:

```powershell
git init
git add .
git commit -m "feat: initial AI Log Generator MVP"
```

## 3. Conectar ao GitHub

Troque `SEU-USUARIO` pelo seu usuário do GitHub:

```powershell
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/ai-log-generator.git
git push -u origin main
```

## 4. Mensagem para o primeiro release

Título:

```text
AI Log Generator MVP
```

Descrição:

```text
Primeira versão funcional do AI Log Generator, com dashboard, geração de logs sintéticos, raw console, parser, análise com IA, exportações e suporte a modo claro/escuro.
```

## 5. Checklist antes de publicar

- Não commitar `.env` com chaves reais
- Confirmar que `.gitignore` bloqueia `.env`, banco local e `node_modules`
- Rodar `npm run dev` localmente
- Testar `/dashboard`, `/generate`, `/logs`, `/ai-builder` e `/settings`
- Adicionar prints no README quando estiver satisfeito com o visual
