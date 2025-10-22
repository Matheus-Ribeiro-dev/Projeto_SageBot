const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios'); 
const { traduzirPergunta, comporResposta } = require('./ai_translator'); 

console.log('Iniciando o SageBot...');

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  console.log('--------------------------------------------------');
  console.log('ESCANEIE O QR CODE ABAIXO COM O SEU CELULAR DE TESTE:');
  qrcode.generate(qr, { small: true });
  console.log('--------------------------------------------------');
});

client.on('ready', () => {
  console.log('✅ Conexão estabelecida! O SageBot está online.');
  console.log('Lembre-se de deixar a API Python (api.py) rodando em outro terminal!');
});

// ---  O FLUXO PRINCIPAL ---
client.on('message', async (msg) => {
  const contato = await msg.getContact();
  const nomeUsuario = contato.pushname || msg.from;
  const pergunta = msg.body;

  console.log(`[Mensagem] Recebido de ${nomeUsuario}: "${pergunta}"`);

  //teste padrao
  if (pergunta.toLowerCase() === 'ping') {
    await client.sendMessage(msg.from, 'pong');
    return;
  }

  try {
    // ETAPA 1: Traduzir a pergunta humana para um JSON
    console.log(`[Fluxo] 1. Traduzindo pergunta...`);
    const ordemJson = await traduzirPergunta(pergunta);
    console.log(`[Fluxo] 1. Ordem JSON recebida da IA:`, ordemJson);

    // Se a IA nao entendeu
    if (ordemJson.funcao === 'erro_nao_entendi' || ordemJson.funcao === 'erro_api_ia') {
      throw new Error("Não consegui entender sua pergunta. Pode tentar de outra forma?");
    }

    // ETAPA 2: enviar o JSON para a API Python (Cérebro de Dados)
    console.log(`[Fluxo] 2. Enviando JSON para a API Python...`);
    const respostaApi = await axios.post('http://127.0.0.1:5000/query', ordemJson);
    
    const resultadoNumerico = respostaApi.data; 
    console.log(`[Fluxo] 2. Resposta recebida do Python:`, resultadoNumerico);

    if (resultadoNumerico.status === 'erro') {
        throw new Error(`Tive um problema ao processar os dados: ${resultadoNumerico.message}`);
    }

    // ETAPA 3: enviar o result ado numerico para a IA embelezar
    console.log(`[Fluxo] 3. Solicitando resposta amigável da IA...`);
    const respostaAmigavel = await comporResposta(pergunta, resultadoNumerico.resultado);
    console.log(`[Fluxo] 3. Resposta final: ${respostaAmigavel}`);

    // ETAPA 4: enviar a rewposta final 
    console.log(`[Fluxo] 4. Enviando resposta final para o WhatsApp.`);
    await client.sendMessage(msg.from, respostaAmigavel);

  } catch (err) {
    console.error('[Fluxo] !! ERRO NO FLUXO !!:', err.message);
    await client.sendMessage(msg.from, `Desculpe, tive um problema: ${err.message}`);
  }
});


console.log('Autenticando...');
client.initialize();