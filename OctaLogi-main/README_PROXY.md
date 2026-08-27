# Cloudflare Worker Proxy - Guia de Configuração e Deploy

Este guia orienta o deploy do **Proxy Serverless no Cloudflare Workers** para integrar o **OctoLogis** com o **GLPI** eliminando problemas de CORS e protegendo os tokens de acesso.

---

## 📋 Pré-requisitos
- Conta gratuita na [Cloudflare](https://dash.cloudflare.com/)

---

## 🚀 Passo a Passo de Deploy no Dashboard do Cloudflare

### 1. Criar o Worker
1. Acesse o **[Dashboard do Cloudflare](https://dash.cloudflare.com/)**.
2. No menu lateral, acesse **Workers & Pages** > **Overview**.
3. Clique no botão **Create Application** > **Create Worker**.
4. Defina o nome do worker como `octologis-glpi-proxy` e clique em **Deploy**.

### 2. Inserir o Código
1. Na tela de confirmação do worker, clique em **Edit code**.
2. Cole todo o conteúdo do arquivo [`cloudflare_worker_proxy.js`](./cloudflare_worker_proxy.js) substituindo o código de exemplo.
3. Clique em **Save and Deploy**.

### 3. Configurar as Variáveis de Ambiente (Secrets)
1. Volte na página do seu Worker e acesse a aba **Settings** > **Variables**.
2. Em **Environment Variables**, clique em **Add variable** e adicione as seguintes 3 variáveis:

| Variável | Valor Exemplo | Criptografia |
| :--- | :--- | :--- |
| `GLPI_BASE_URL` | `https://helpdesk.lightfarmstudios.com.br/apirest.php` | Text |
| `GLPI_APP_TOKEN` | `Dw54T0fAqZhM4zHWVBtZylhldKnhXcifTUi9uuxX` | **Encrypt (Secret)** |
| `GLPI_USER_TOKEN` | `O7E1mGrsgMYmOC0C8XXnBtzqvIsfnbHSgjowt6Wp` | **Encrypt (Secret)** |

3. Clique em **Save and Deploy**.

---

## 🔗 Conectar no OctoLogis (`script.js`)

1. Copie a URL pública do seu Worker gerada pelo Cloudflare (exemplo: `https://octologis-glpi-proxy.SEU-SUBDOMINIO.workers.dev`).
2. No arquivo [`script.js`](./script.js), atualize o objeto `GLPI_CONFIG`:

```javascript
const GLPI_CONFIG = {
  USE_PROXY: true,
  PROXY_URL: 'https://octologis-glpi-proxy.SEU-SUBDOMINIO.workers.dev', // Coloque a URL do Worker aqui
  BASE_URL: 'https://helpdesk.lightfarmstudios.com.br/apirest.php',
  APP_TOKEN: '', // Pode deixar vazio no client-side pois está salvo no Worker
  USER_TOKEN: '',
  SESSION_TOKEN: ''
};
```
