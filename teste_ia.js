//teste isolado
const { traduzirPergunta } = require('./ai_translator.js');

async function rodarTesteUnico() {
  console.log('--- [Iniciando Teste Único da IA] ---');

  const pergunta = "qual o faturamento total?";

  console.log(`[Teste] Perguntando: "${pergunta}"`);

  const ordemJson = await traduzirPergunta(pergunta);

  console.log('\n--- Objeto JSON Gerado ---');
  console.log(ordemJson);
  console.log('--------------------------');

  console.log('\n--- [Teste Concluído] ---');
}

// executa o teste
rodarTesteUnico();