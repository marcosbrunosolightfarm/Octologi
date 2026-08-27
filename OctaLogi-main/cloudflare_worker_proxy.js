/**
 * Cloudflare Worker Proxy para API REST do GLPI - OctoLogis
 * 
 * Este worker atua como um proxy serverless seguro entre o OctoLogis e a API REST do GLPI:
 * 1. Oculta APP_TOKEN e USER_TOKEN do código público client-side.
 * 2. Resolve 100% dos bloqueios de CORS liberando Access-Control-Allow-Origin: *.
 * 3. Mantém a restrição de SOMENTE LEITURA (HTTP GET).
 * 
 * Instruções completas de deploy disponíveis no arquivo README_PROXY.md
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Tratamento de Requisições Preflight de CORS (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, App-Token, Session-Token',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // 2. Garantir que apenas HTTP GET é aceito
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Método não permitido. Utilize apenas GET.' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    try {
      // Obter credenciais e URL das variáveis de ambiente seguras do Worker
      const baseUrl = (env.GLPI_BASE_URL || 'https://helpdesk.lightfarmstudios.com.br/apirest.php').trim().replace(/\/+$/, '');
      const appToken = (env.GLPI_APP_TOKEN || '').trim();
      const userToken = (env.GLPI_USER_TOKEN || '').trim();

      if (!baseUrl || !appToken || !userToken) {
        return new Response(JSON.stringify({
          error: 'Configuração incompleta do Worker. Defina GLPI_BASE_URL, GLPI_APP_TOKEN e GLPI_USER_TOKEN nas variáveis de ambiente do Cloudflare.'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 3. Autenticação initSession no GLPI (via Header Authorization)
      const initUrl = `${baseUrl}/initSession`;
      const initResp = await fetch(initUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'App-Token': appToken,
          'Authorization': `user_token ${userToken}`
        }
      });

      if (!initResp.ok) {
        const errText = await initResp.text().catch(() => '');
        return new Response(JSON.stringify({
          error: `Falha na autenticação do GLPI initSession (${initResp.status})`,
          details: errText
        }), {
          status: initResp.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const initData = await initResp.json();
      const sessionToken = initData.session_token;

      if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'Session-Token não retornado pelo GLPI.' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 4. Buscar Colaboradores (/User) com range=0-1000 e recursividade
      const userUrl = `${baseUrl}/User?expand_dropdowns=true&is_recursive=true&get_all=true&range=0-1000&range_size=1000&is_deleted=0`;
      const userResp = await fetch(userUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'App-Token': appToken,
          'Session-Token': sessionToken,
          'Range': '0-1000'
        }
      });

      // 5. Fechar sessão no GLPI em segundo plano (clean-up via GET /killSession)
      ctx.waitUntil(
        fetch(`${baseUrl}/killSession`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'App-Token': appToken,
            'Session-Token': sessionToken
          }
        }).catch(() => {})
      );

      if (!userResp.ok) {
        const errText = await userResp.text().catch(() => '');
        return new Response(JSON.stringify({
          error: `Falha ao buscar usuários no GLPI (${userResp.status})`,
          details: errText
        }), {
          status: userResp.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const rawData = await userResp.json();

      // 6. Retornar resposta JSON com cabeçalho CORS liberado
      return new Response(JSON.stringify(rawData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300'
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({
        error: 'Erro interno no Worker Proxy',
        message: err.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
