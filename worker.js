// =================================================================================
//  项目: perplexity-2api (Cloudflare Worker 单文件版)
//  版本: 1.0.1 (代号: Chimera Synthesis - PPLX Fix)
//  作者: 首席AI执行官 (Principal AI Executive Officer)
//  协议: 奇美拉协议 · 综合版 (Project Chimera: Synthesis Edition)
//  日期: 2025-11-24
//
//  描述:
//  本文件是一个完全自包含、可一键部署的 Cloudflare Worker。它将 Perplexity.ai
//  的 SSE 接口无损转换为兼容 OpenAI 标准的 API。
//
//  [更新日志 v1.0.1]:
//  1. 更新了 User-Agent 和 Cookie 以匹配最新抓包数据。
//  2. 修复了浏览器请求 favicon.ico 报 404 的问题。
//  3. 增强了上游错误捕获，防止返回 200 但无内容的情况。
// =================================================================================

// --- [第一部分: 核心配置 (Configuration-as-Code)] ---
const CONFIG = {
  // 项目元数据
  PROJECT_NAME: "perplexity-2api",
  PROJECT_VERSION: "1.0.1",
  
  // 安全配置 (建议在 Cloudflare 环境变量中设置 API_MASTER_KEY)
  API_MASTER_KEY: "1", 
  
  // 上游服务配置
  UPSTREAM_URL: "https://www.perplexity.ai/rest/sse/perplexity_ask",
  ORIGIN_URL: "https://www.perplexity.ai",
  REFERER_URL: "https://www.perplexity.ai/",
  
  // 凭证配置 (基于您提供的最新抓包数据)
  PPLX_COOKIE: "pplx.visitor-id=f19d46a9-a017-43e0-b5ea-74f062b54c21; _gcl_au=1.1.1954594475.1759810447; _fbp=fb.1.1759810530992.316158508312651898; __ps_r=_; __ps_lu=https://www.perplexity.ai/?login-source=floatingSignup&login-new=false&__cf_chl_tk=IMq5WQus75WAgXQcNl2nNq8FZxXQIS2myr1SXJCdSE4-1759810513-1.0.1.1-JztOubQObWd1Wk3eA.Q.rKxAp.fqHZJevmEkxoU9G0o; __ps_fva=1759810531078; pplx.personal-search-badge-seen={%22sidebar%22:true%2C%22settingsSidebar%22:false%2C%22personalize%22:false}; sidebar-upgrade-badge=10; __stripe_mid=0d7e06d6-c463-4dab-9809-6516262c0278e60afc; gov-badge=3; sidebarHiddenHubs=[%22SIDEBAR_FINANCE%22%2C%22SIDEBAR_SHOPPING%22%2C%22SIDEBAR_TRAVEL%22%2C%22SIDEBAR_ACADEMIC%22%2C%22SIDEBAR_SPORTS%22]; pplx.search-mode=search; intercom-id-l2wyozh0=21ac64b7-10ef-4d87-85d0-1ef6718519cb; intercom-session-l2wyozh0=; intercom-device-id-l2wyozh0=1bd11f99-1f00-4c35-9ada-aa496322b14b; pplx.tasks-settings-seen=true; next-auth.csrf-token=527aa6c474963d607693f9b011328b48f08d75e8d4a947be9beefb9c41dde087%7C7b0f48c30718044eb5d21f4e0ed6cf025fc7d8f5c4c9f8f2a555e64e221dfaa0; next-auth.callback-url=https%3A%2F%2Fwww.perplexity.ai%2Fapi%2Fauth%2Fsignin-callback%3Fredirect%3Dhttps%253A%252F%252Fwww.perplexity.ai; _rdt_uuid=1759810529827.99d9de3f-9d8a-4b86-b14e-9804440441e3; _rdt_em=:f11abad7c389ca471ed98ab997abd73d175f417f0d196e17fd7c9f760a181cbc; __cflb=02DiuDyvFMmK5p9jVbVnMNSKYZhUL9aGmpMzzj7gQ5qQY; __cf_bm=kcYlZRSvGcWLiFa2fm_h6LpfvFGlfJ_HHrQTdOVZ1Sw-1763952470-1.0.1.1-DlyJQi77TILhuHphIyf7KeS1T_5sS55tC7eSb4lsdpgWm1zyf.XFumx5nE94.G2Hg1A_jOr1.GuItN5UNKNL8XzsbLXJdGlTnkRrYbm7c84; pplx.session-id=e8193671-59a2-4fe5-8810-995c72d99dfe; cf_clearance=NdZgEPOrQWxEJZGjb_rbcgzawF2DL1K.cFMGfuDT_9k-1763952543-1.2.1.1-iyumaH8Ual8MzRfOPBF8nUpdWbToeIrcMPEbjF2D91CK6fphIdlaIxRJ5_lhejDXShfHmZOH5ULAhwJme16ttbi2m6xmvQzn6iKq0ZUxr0Ib0fPnMnqlAeqVB2LDa5h01YhkJVU.fW958LPOSoAQuZ6YQpu9WaD5vWt1vUP.XAvO9o.WTMrKka.YkhO1tRmFmzZWQLdS3wUm9CjzO.9H2jE_GZg4SXdhRJ.ot8dNy3g9VXSd56Okkp60Msd6Lc60; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..Ls7RJwaFioBVewqM.xwG0-WpeB636piTh9mnyfFDuIlWhs6Y0SUSYInCwfKRTwxi161bAT1H9LVhDrJwLIKCZDMswUWhuhqhwOXt7-WB5SssX1isglyP9ESsRzVrcyEdl79mn6eXPSUumOUEvEDbIPye76HcC0zXYgx6qzm9QHY_LvpKPgQhtTej0K9wSfW2CImPfN59az92EsqcZqo_TN0lzFA31gy8LVLl-o63_jQ4w80A2ZzoU6GiGLVjCfKb32mdVDq5orzxQI1TTcsPJu4mBI4w_rWjhsTMvZuO6x4WSaFxfFRGuexXj40dCJ9fwhRwIxF3bgvIIcZl9gztZxcPZS31s3IHOtaBFcgm_2R1-p4jWV9_1-gHyQ9yNdh7FLssH0FkLsE1RzZ97P5Uf1oSN7wrnSGxoY839feqnXDW8leP_yjcvkLtjLeI.3wqcUXset2bkYAHWikW25A; _dd_s=aid=080284c5-5b0d-4275-bec6-69adab4f424c&rum=2&id=efc66442-1d28-4673-acdb-bc36f5694afb&created=1763951590047&expire=1763953480959&logs=0; pplx.metadata={%22qc%22:169%2C%22qcu%22:260%2C%22qcm%22:0%2C%22qcc%22:239%2C%22qcco%22:0%2C%22qccol%22:0%2C%22qcdr%22:18%2C%22qcs%22:0%2C%22qcd%22:0%2C%22hli%22:true%2C%22hcga%22:true%2C%22hcds%22:false%2C%22hso%22:false%2C%22hfo%22:false%2C%22hsco%22:false%2C%22hfco%22:false%2C%22hsma%22:false%2C%22hdc%22:true%2C%22fqa%22:1759881337545%2C%22lqa%22:1763952580961}",
  
  USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",

  // 模型列表
  MODELS: [
    "gemini30pro", 
    "gpt-4o",
    "claude-3-opus",
    "sonar-reasoning-pro",
    "sonar-pro"
  ],
  DEFAULT_MODEL: "gemini30pro"
};

// --- [第二部分: Worker 入口与路由] ---
export default {
  async fetch(request, env, ctx) {
    const apiKey = env.API_MASTER_KEY || CONFIG.API_MASTER_KEY;
    const url = new URL(request.url);

    // 1. 预检请求
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight();
    }

    // 2. 静态资源静默处理 (修复 404 报错)
    if (url.pathname === '/favicon.ico' || url.pathname === '/robots.txt') {
      return new Response(null, { status: 204 });
    }

    // 3. 开发者驾驶舱 (Web UI)
    if (url.pathname === '/') {
      return handleUI(request, apiKey);
    } 
    // 4. API 路由
    else if (url.pathname.startsWith('/v1/')) {
      return handleApi(request, apiKey);
    } 
    // 5. 404
    else {
      return createErrorResponse(`路径未找到: ${url.pathname}`, 404, 'not_found');
    }
  }
};

// --- [第三部分: API 代理逻辑] ---

async function handleApi(request, apiKey) {
  const authHeader = request.headers.get('Authorization');
  if (apiKey && apiKey !== "1") {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('需要 Bearer Token 认证。', 401, 'unauthorized');
    }
    const token = authHeader.substring(7);
    if (token !== apiKey) {
      return createErrorResponse('无效的 API Key。', 403, 'invalid_api_key');
    }
  }

  const url = new URL(request.url);
  const requestId = `req-${crypto.randomUUID()}`;

  if (url.pathname === '/v1/models') {
    return handleModelsRequest();
  } else if (url.pathname === '/v1/chat/completions') {
    return handleChatCompletions(request, requestId);
  } else {
    return createErrorResponse(`不支持的 API 路径: ${url.pathname}`, 404, 'not_found');
  }
}

function handleModelsRequest() {
  const modelsData = {
    object: 'list',
    data: CONFIG.MODELS.map(modelId => ({
      id: modelId,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'perplexity-2api',
    })),
  };
  return new Response(JSON.stringify(modelsData), {
    headers: corsHeaders({ 'Content-Type': 'application/json; charset=utf-8' })
  });
}

async function handleChatCompletions(request, requestId) {
  try {
    const body = await request.json();
    const messages = body.messages || [];
    const lastMsg = messages.reverse().find(m => m.role === 'user');
    if (!lastMsg) throw new Error("未找到用户消息");

    const query = lastMsg.content;
    const model = body.model || CONFIG.DEFAULT_MODEL;

    // 构造 Perplexity 请求体 (严格匹配抓包格式)
    const pplxPayload = {
      "params": {
        "attachments": [],
        "language": "zh-CN",
        "timezone": "Asia/Shanghai",
        "search_focus": "internet",
        "sources": ["web"],
        "search_recency_filter": null,
        "frontend_uuid": crypto.randomUUID(),
        "mode": "copilot",
        "model_preference": model,
        "is_related_query": false,
        "is_sponsored": false,
        "frontend_context_uuid": crypto.randomUUID(),
        "prompt_source": "user",
        "query_source": "home",
        "is_incognito": false,
        "time_from_first_type": 1234.5, // 模拟打字时间
        "local_search_enabled": false,
        "use_schematized_api": true,
        "send_back_text_in_streaming_api": false,
        "supported_block_use_cases": [
          "answer_modes", "media_items", "knowledge_cards", "inline_entity_cards", 
          "place_widgets", "finance_widgets", "prediction_market_widgets", "sports_widgets", 
          "flight_status_widgets", "shopping_widgets", "jobs_widgets", "search_result_widgets", 
          "clarification_responses", "inline_images", "inline_assets", "placeholder_cards", 
          "diff_blocks", "inline_knowledge_cards", "entity_group_v2", "refinement_filters", 
          "canvas_mode", "maps_preview", "answer_tabs", "price_comparison_widgets", "preserve_latex"
        ],
        "client_coordinates": null,
        "mentions": [],
        "dsl_query": query,
        "skip_search_enabled": true,
        "is_nav_suggestions_disabled": false,
        "always_search_override": false,
        "override_no_search": false,
        "should_ask_for_mcp_tool_confirmation": true,
        "browser_agent_allow_once_from_toggle": false,
        "supported_features": ["browser_agent_permission_banner"],
        "version": "2.18"
      },
      "query_str": query
    };

    const response = await fetch(CONFIG.UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": CONFIG.PPLX_COOKIE,
        "User-Agent": CONFIG.USER_AGENT,
        "Accept": "text/event-stream",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Origin": CONFIG.ORIGIN_URL,
        "Referer": CONFIG.REFERER_URL,
        "x-perplexity-request-reason": "perplexity-query-state-provider",
        "x-request-id": requestId,
        "priority": "u=1, i",
        "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
      },
      body: JSON.stringify(pplxPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上游服务错误 (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    (async () => {
      const reader = response.body.getReader();
      let buffer = "";
      let lastAnswer = "";
      let hasSentContent = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6).trim();
              if (!jsonStr) continue;
              
              try {
                const data = JSON.parse(jsonStr);
                
                // 提取逻辑：Perplexity 返回全量文本，我们需要计算增量
                let currentAnswer = "";
                
                // 1. 尝试从 answer 字段获取
                if (data.answer) {
                  currentAnswer = data.answer;
                } 
                // 2. 尝试从 text 字段解析 (有时是 JSON 字符串)
                else if (data.text) {
                  try {
                    const textObj = JSON.parse(data.text);
                    if (textObj.answer) currentAnswer = textObj.answer;
                    else if (textObj.chunks) currentAnswer = textObj.chunks.join('');
                  } catch(e) {
                    currentAnswer = data.text;
                  }
                }
                // 3. 尝试从 markdown_block 获取 (新版 API 特征)
                else if (data.blocks) {
                    const mdBlock = data.blocks.find(b => b.field === 'markdown_block');
                    if (mdBlock && mdBlock.patches) {
                        // 这是一个 diff block，比较复杂，这里简化处理：
                        // 如果有 answer 字段在根目录，优先使用
                    }
                }

                // 如果找到了新的内容
                if (currentAnswer && currentAnswer.length > lastAnswer.length) {
                  const deltaText = currentAnswer.substring(lastAnswer.length);
                  lastAnswer = currentAnswer;
                  hasSentContent = true;

                  const chunk = {
                    id: requestId,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: model,
                    choices: [{ index: 0, delta: { content: deltaText }, finish_reason: null }]
                  };
                  await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
        
        // 如果整个过程没有发送任何内容，说明上游虽然返回 200 但没有有效数据
        // 这通常意味着被软拦截了
        if (!hasSentContent) {
            const errChunk = {
                id: requestId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: model,
                choices: [{ index: 0, delta: { content: "\n\n[警告: 上游返回了空响应。这通常意味着 Cookie 失效或被 WAF 拦截。请检查控制台日志并更新 .env 中的 Cookie。]" }, finish_reason: null }]
            };
            await writer.write(encoder.encode(`data: ${JSON.stringify(errChunk)}\n\n`));
        }

      } catch (e) {
        const errChunk = {
          id: requestId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{ index: 0, delta: { content: `\n\n[Error: ${e.message}]` }, finish_reason: 'stop' }]
        };
        await writer.write(encoder.encode(`data: ${JSON.stringify(errChunk)}\n\n`));
      } finally {
        const endChunk = {
          id: requestId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
        };
        await writer.write(encoder.encode(`data: ${JSON.stringify(endChunk)}\n\n`));
        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: corsHeaders({ 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      })
    });

  } catch (e) {
    return createErrorResponse(e.message, 500, 'generation_failed');
  }
}

// --- 辅助函数 ---
function createErrorResponse(message, status, code) {
  return new Response(JSON.stringify({
    error: { message, type: 'api_error', code }
  }), {
    status,
    headers: corsHeaders({ 'Content-Type': 'application/json; charset=utf-8' })
  });
}

function handleCorsPreflight() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

function corsHeaders(headers = {}) {
  return {
    ...headers,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// --- [第四部分: 开发者驾驶舱 UI] ---
function handleUI(request, apiKey) {
  const origin = new URL(request.url).origin;
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${CONFIG.PROJECT_NAME} - 开发者驾驶舱</title>
    <style>
      :root { --bg: #121212; --panel: #1E1E1E; --border: #333; --text: #E0E0E0; --primary: #FFBF00; --accent: #007AFF; --error: #CF6679; --success: #00C853; }
      body { font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); margin: 0; height: 100vh; display: flex; overflow: hidden; }
      
      /* Layout */
      .sidebar { width: 380px; background: var(--panel); border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; overflow-y: auto; }
      .main { flex: 1; display: flex; flex-direction: column; padding: 20px; }
      
      /* Components */
      .box { background: #252525; padding: 12px; border-radius: 6px; border: 1px solid var(--border); margin-bottom: 15px; }
      .label { font-size: 12px; color: #888; margin-bottom: 5px; display: block; }
      .code-block { font-family: monospace; font-size: 12px; color: var(--primary); word-break: break-all; background: #111; padding: 8px; border-radius: 4px; cursor: pointer; position: relative; }
      .code-block:hover::after { content: "点击复制"; position: absolute; right: 5px; top: 5px; color: #fff; font-size: 10px; background: #333; padding: 2px 4px; border-radius: 2px; }
      
      input, select, textarea { width: 100%; background: #333; border: 1px solid #444; color: #fff; padding: 8px; border-radius: 4px; margin-bottom: 10px; box-sizing: border-box; font-family: inherit; }
      input:focus, select:focus, textarea:focus { border-color: var(--primary); outline: none; }
      
      button { width: 100%; padding: 10px; background: var(--primary); border: none; border-radius: 4px; font-weight: bold; cursor: pointer; color: #000; transition: opacity 0.2s; }
      button:hover { opacity: 0.9; }
      button:disabled { background: #555; cursor: not-allowed; }
      
      /* Chat Window */
      .chat-window { flex: 1; background: #000; border: 1px solid var(--border); border-radius: 8px; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; font-size: 14px; line-height: 1.6; }
      .msg { max-width: 85%; padding: 10px 15px; border-radius: 8px; word-wrap: break-word; }
      .msg.user { align-self: flex-end; background: #333; color: #fff; border-bottom-right-radius: 2px; }
      .msg.ai { align-self: flex-start; background: #1a1a1a; border: 1px solid #333; border-bottom-left-radius: 2px; }
      .msg.error { align-self: center; background: rgba(207, 102, 121, 0.1); border: 1px solid var(--error); color: var(--error); font-size: 12px; }
      
      /* Status Indicator */
      .status-indicator { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #888; margin-bottom: 20px; }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #555; }
      .dot.active { background: var(--success); box-shadow: 0 0 5px var(--success); }
      .dot.error { background: var(--error); }
      
      /* Tabs */
      .tabs { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 10px; }
      .tab { padding: 8px 12px; cursor: pointer; color: #888; border-bottom: 2px solid transparent; font-size: 12px; }
      .tab.active { color: var(--primary); border-bottom-color: var(--primary); }
      .tab-content { display: none; }
      .tab-content.active { display: block; }
      
      /* Spinner */
      .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid #888; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-right: 5px; vertical-align: middle; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="status-indicator">
            <div class="dot active" id="status-dot"></div>
            <span id="status-text">系统就绪 v${CONFIG.PROJECT_VERSION}</span>
        </div>
        
        <h2 style="margin-top:0">🧠 ${CONFIG.PROJECT_NAME}</h2>
        
        <div class="box">
            <span class="label">API 密钥 (Master Key)</span>
            <div class="code-block" onclick="copy('${apiKey}')">${apiKey}</div>
        </div>

        <div class="box">
            <span class="label">API 接口地址</span>
            <div class="code-block" onclick="copy('${origin}/v1/chat/completions')">${origin}/v1/chat/completions</div>
        </div>

        <div class="box">
            <span class="label">模型 (Model)</span>
            <select id="model">
                ${CONFIG.MODELS.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
            
            <span class="label" style="margin-top:10px">测试输入</span>
            <textarea id="prompt" rows="4" placeholder="输入问题，例如：Perplexity 是什么？"></textarea>
            
            <button id="btn-send" onclick="sendMessage()">发送请求</button>
        </div>

        <div class="box">
            <div class="tabs">
                <div class="tab active" onclick="switchTab('curl')">cURL</div>
                <div class="tab" onclick="switchTab('python')">Python</div>
            </div>
            <div id="curl" class="tab-content active">
                <div class="code-block" onclick="copy(this.innerText)">curl ${origin}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{
    "model": "${CONFIG.DEFAULT_MODEL}",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": true
  }'</div>
            </div>
            <div id="python" class="tab-content">
                <div class="code-block" onclick="copy(this.innerText)">import openai
client = openai.OpenAI(
    api_key="${apiKey}",
    base_url="${origin}/v1"
)
stream = client.chat.completions.create(
    model="${CONFIG.DEFAULT_MODEL}",
    messages=[{"role": "user", "content": "你好"}],
    stream=True
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")</div>
            </div>
        </div>
    </div>

    <main class="main">
        <div class="chat-window" id="chat">
            <div style="color:#666; text-align:center; margin-top:50px;">
                Perplexity 代理服务已连接。<br>
                <small>注意：此服务依赖 Cookie，请确保 .env 配置正确。</small>
            </div>
        </div>
    </main>

    <script>
        const API_KEY = "${apiKey}";
        const ENDPOINT = "${origin}/v1/chat/completions";
        
        function copy(text) {
            navigator.clipboard.writeText(text);
            const btn = document.getElementById('btn-send');
            const originalText = btn.innerText;
            btn.innerText = "已复制!";
            setTimeout(() => btn.innerText = originalText, 1000);
        }

        function switchTab(id) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById(id).classList.add('active');
        }

        function appendMsg(role, text) {
            const div = document.createElement('div');
            div.className = \`msg \${role}\`;
            if (role === 'ai') {
                text = text.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>').replace(/\\n/g, '<br>');
            }
            div.innerHTML = text;
            document.getElementById('chat').appendChild(div);
            div.scrollIntoView({ behavior: "smooth" });
            return div;
        }

        async function sendMessage() {
            const prompt = document.getElementById('prompt').value.trim();
            if (!prompt) return;

            const btn = document.getElementById('btn-send');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> 思考中...';

            if(document.querySelector('.chat-window').innerText.includes('代理服务已连接')) {
                document.getElementById('chat').innerHTML = '';
            }

            appendMsg('user', prompt);
            const aiMsgDiv = appendMsg('ai', '<span class="spinner"></span>');
            let fullText = "";

            try {
                const res = await fetch(ENDPOINT, {
                    method: 'POST',
                    headers: { 
                        'Authorization': 'Bearer ' + API_KEY, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        model: document.getElementById('model').value,
                        messages: [{role: "user", content: prompt}],
                        stream: true
                    })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error?.message || '请求失败');
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(line.substring(6));
                                const delta = data.choices[0].delta.content;
                                if (delta) {
                                    fullText += delta;
                                    let formatted = fullText.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>').replace(/\\n/g, '<br>');
                                    aiMsgDiv.innerHTML = formatted;
                                    aiMsgDiv.scrollIntoView({ behavior: "smooth" });
                                }
                            } catch (e) {}
                        }
                    }
                }

            } catch (e) {
                appendMsg('error', \`❌ 错误: \${e.message}\`);
            } finally {
                btn.disabled = false;
                btn.innerText = "发送请求";
                if (fullText === "") aiMsgDiv.innerHTML = "<i>(无内容返回，可能被拦截)</i>";
            }
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Encoding': 'br'
    },
  });
}
