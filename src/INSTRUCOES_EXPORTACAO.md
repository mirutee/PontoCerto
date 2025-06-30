
# Guia de Exportação e Desenvolvimento Contínuo

Este guia irá ajudá-lo a transferir seu projeto do Firebase Studio para sua máquina local, publicá-lo no Render via GitHub e, mais importante, como continuar desenvolvendo usando a IA do Studio.

---

### Parte 1: Exportação Inicial do Projeto

O objetivo aqui é criar uma cópia exata do projeto que está na nuvem para a sua máquina local.

**1. Crie a pasta principal do projeto:**
No seu computador, crie uma nova pasta. Ex: `meu-projeto-ponto`. Abra o terminal (Prompt de Comando) dentro desta pasta.

**2. Crie a estrutura de diretórios:**
Execute o comando abaixo no seu terminal para criar todas as pastas necessárias de uma só vez. Este comando é para o **Prompt de Comando do Windows**.

```cmd
md .vscode src\ai\flows src\app\absences src\app\actions src\app\admin src\app\calendar src\app\company src\app\dashboard src\app\documents src\app\login src\app\reports src\app\settings src\app\signup src\components\absences src\components\calendar src\components\dashboard src\components\layout src\components\ui src\hooks src\lib\supabase
```

**3. Copie e cole cada arquivo:**
Agora, para cada arquivo listado abaixo, faça o seguinte:
    a. Na sua máquina, crie um arquivo com o mesmo nome e na pasta correta.
    b. No Firebase Studio, abra o arquivo correspondente no editor.
    c. Copie **todo** o conteúdo dele.
    d. Cole o conteúdo no arquivo que você criou na sua máquina e salve.

#### Lista de Arquivos para a Cópia Inicial:

- `/.env`
- `/.vscode/settings.json`
- `/README.md`
- `/apphosting.yaml`
- `/components.json`
- `/next-env.d.ts`
- `/next.config.ts`
- `/package.json`
- `/src/ai/dev.ts`
- `/src/ai/flows/suggest-time-off-justification.ts`
- `/src/ai/genkit.ts`
- `/src/app/absences/page.tsx`
- `/src/app/actions/admin-actions.ts`
- `/src/app/actions/suggest-justification.ts`
- `/src/app/admin/page.tsx`
- `/src/app/calendar/page.tsx`
- `/src/app/company/page.tsx`
- `/src/app/dashboard/page.tsx`
- `/src/app/documents/page.tsx`
- `/src/app/globals.css`
- `/src/app/layout.tsx`
- `/src/app/login/page.tsx`
- `/src/app/page.tsx`
- `/src/app/reports/page.tsx`
- `/src/app/settings/page.tsx`
- `/src/app/signup/page.tsx`
- `/src/components/absences/absence-request-form.tsx`
- `/src/components/calendar/calendar-view.tsx`
- `/src/components/dashboard/productivity-chart.tsx`
- `/src/components/dashboard/team-attendance.tsx`
- `/src/components/dashboard/time-clock.tsx`
- `/src/components/dashboard/upcoming-absences.tsx`
- `/src/components/layout/header.tsx`
- `/src/components/layout/main-layout.tsx`
- `/src/components/layout/sidebar-nav.tsx`
- `/src/components/ui/accordion.tsx`
- `/src/components/ui/alert-dialog.tsx`
- `/src/components/ui/alert.tsx`
- `/src/components/ui/avatar.tsx`
- `/src/components/ui/badge.tsx`
- `/src/components/ui/button.tsx`
- `/src/components/ui/calendar.tsx`
- `/src/components/ui/card.tsx`
- `/src/components/ui/carousel.tsx`
- `/src/components/ui/chart.tsx`
- `/src/components/ui/checkbox.tsx`
- `/src/components/ui/collapsible.tsx`
- `/src/components/ui/dialog.tsx`
- `/src/components/ui/dropdown-menu.tsx`
- `/src/components/ui/form.tsx`
- `/src/components/ui/input.tsx`
- `/src/components/ui/label.tsx`
- `/src/components/ui/menubar.tsx`
- `/src/components/ui/popover.tsx`
- `/src/components/ui/progress.tsx`
- `/src/components/ui/radio-group.tsx`
- `/src/components/ui/scroll-area.tsx`
- `/src/components/ui/select.tsx`
- `/src/components/ui/separator.tsx`
- `/src/components/ui/sheet.tsx`
- `/src/components/ui/sidebar.tsx`
- `/src/components/ui/skeleton.tsx`
- `/src/components/ui/slider.tsx`
- `/src/components/ui/switch.tsx`
- `/src/components/ui/table.tsx`
- `/src/components/ui/tabs.tsx`
- `/src/components/ui/textarea.tsx`
- `/src/components/ui/toast.tsx`
- `/src/components/ui/toaster.tsx`
- `/src/components/ui/tooltip.tsx`
- `/src/hooks/use-mobile.tsx`
- `/src/hooks/use-toast.ts`
- `/src/lib/data.ts`
- `/src/lib/supabase/admin.ts`
- `/src/lib/supabase/client.ts`
- `/src/lib/supabase/models.ts`
- `/src/lib/utils.ts`
- `/tailwind.config.ts`
- `/tsconfig.json`

---

### Parte 2: Enviar para o GitHub

Depois que todos os arquivos estiverem na sua máquina, volte ao terminal na pasta do projeto.

1.  **Crie um repositório no GitHub** (vazio, sem README ou .gitignore).
2.  Copie a URL do seu novo repositório.
3.  Execute os seguintes comandos:
    ```bash
    # Crie um arquivo .gitignore para não enviar segredos e pastas geradas
    echo ".env.local" > .gitignore
    echo "node_modules" >> .gitignore
    echo ".next" >> .gitignore

    # Instale todas as dependências do projeto.
    # Isso vai criar a pasta node_modules e o arquivo package-lock.json. É um passo crucial.
    npm install
    
    # Inicialize o git
    git init -b main
    git add .
    git commit -m "Commit inicial do projeto TimeWise"
    
    # Conecte ao seu repositório remoto
    git remote add origin SUA_URL_DO_GITHUB_AQUI
    
    # Envie os arquivos
    git push -u origin main
    ```

---

### Parte 3: Publicar no Render

1.  Acesse o [Render](https://render.com/), crie uma conta e faça login.
2.  No painel, clique em **New +** > **Web Service**.
3.  Conecte sua conta do GitHub e selecione o repositório que você acabou de criar.
4.  O Render deve detectar que é um projeto Next.js. Verifique se os comandos são:
    *   **Build Command:** `npm install && npm run build`
    *   **Start Command:** `npm start`
5.  **Variáveis de Ambiente (CRÍTICO):**
    *   Vá para a seção **Environment**.
    *   Adicione as três variáveis a seguir, copiando os valores do seu arquivo `.env`:
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `SUPABASE_SERVICE_ROLE_KEY`
6.  Clique em **Create Web Service**. O Render irá construir e publicar seu site, dando-lhe uma URL pública.

---

### Parte 4: Como Continuar Desenvolvendo (Fluxo Contínuo)

Este é o ciclo que você seguirá para fazer novas alterações no seu projeto.

**Onde as coisas acontecem:**
- **Ambiente de Desenvolvimento:** Firebase Studio (aqui é onde você conversa com a IA).
- **Controle de Versão:** Sua máquina local e GitHub.
- **Publicação (Deploy):** Render.

**O Ciclo de Alterações:**

1.  **Peça a Mudança:** Continue pedindo alterações de código para a IA aqui no **Firebase Studio**, como sempre fez.
2.  **Identifique os Arquivos:** A IA sempre informará quais arquivos foram modificados. Preste atenção nessa lista.
3.  **Sincronize Localmente:** Para cada arquivo que a IA modificou:
    a. Abra o arquivo no editor do **Firebase Studio**.
    b. Copie todo o seu conteúdo.
    c. Abra o mesmo arquivo na **sua máquina local** e substitua o conteúdo antigo pelo novo que você copiou.
4.  **Envie para o GitHub:** No terminal, na pasta do seu projeto na sua máquina, execute os seguintes comandos:
    ```bash
    # Veja quais arquivos foram alterados (opcional, para verificação)
    git status

    # Adicione as alterações para o próximo "commit"
    git add .

    # Crie um "commit" (um ponto salvo na história) com uma mensagem descritiva
    git commit -m "Adiciona funcionalidade X" 

    # Envie suas alterações para o GitHub
    git push
    ```
5.  **Deploy Automático:** O **Render** detectará automaticamente que você enviou novas alterações para o GitHub e começará um novo processo de publicação. Em alguns minutos, seu site estará atualizado com as novas mudanças.

Repita este ciclo sempre que quiser adicionar ou modificar algo no seu aplicativo.
