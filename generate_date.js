// gerar arquivo vendas_ficticias
const fs = require('fs');
const path = require('path');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}


const lojas = [
  { id: 'LOJA01', nome: 'Loja SP' },
  { id: 'LOJA02', nome: 'Loja SC' },
  { id: 'LOJA03', nome: 'Loja RS' },
];

const departamentos = [
  { id: 'CALC', nome: 'Calcados' },
  { id: 'ELET', nome: 'Eletronicos' },
  { id: 'VEST', nome: 'Vestuario' },
  { id: 'ALIM', nome: 'Alimentos' },
];

const marcas = ['Marca Enterprise', 'Marca NewTrend', 'Marca Hard', 'Marca Generica'];
const fornecedores = ['GRAN_PLAYER', 'CANETA_DISTRITO', 'VAREJO_NACIONAL'];


const produtos = [];
for (let i = 1; i <= 100; i++) {
  const depto = randomItem(departamentos);
  const custo = randomFloat(20, 300);
  
  produtos.push({
    cod_produto: `SKU${i.toString().padStart(5, '0')}`,
    nome_produto: `Produto ${depto.nome} ${i}`,
    departamento: depto.nome,
    marca: randomItem(marcas),
    fornecedor_id: randomItem(fornecedores),
    custo_produto_unitario: custo,
    preco_venda_unitario: custo * randomFloat(1.4, 2.0),
  });
}

console.log(`Gerados ${produtos.length} produtos no catalogo.`);


const startDate = new Date('2024-01-01');
const endDate = new Date('2025-09-30'); 
const linhasCsv = [];

const headers = [
  'data',
  'loja_id',
  'departamento',
  'marca',
  'fornecedor_id',
  'cod_produto',
  'nome_produto',
  'quantidade_vendida',
  'custo_produto_unitario',
  'valor_venda_liquida', 
  'estoque_final_dia' 
];
linhasCsv.push(headers.join(','));

let totalLinhas = 0;
for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
  const dataAtual = formatDate(d);
  const diaSemana = d.getDay(); 

  for (const loja of lojas) {
    
    for (const produto of produtos) {
      
      
      let chanceDeVender = 0.15; 
      
      if (diaSemana === 0 || diaSemana === 5 || diaSemana === 6) {
        chanceDeVender = 0.25; 
      }
      
      if (produto.departamento === 'Eletronicos' && d.getMonth() === 10) { // Mês 10 = Novembro
        chanceDeVender = 0.40; 
      }

    if (produto.departamento === 'Calcados' && d.getMonth() === 12) {
        chanceDeVender = 0.60; 
     }
    if (produto.departamento === 'Calcados' && d.getMonth() === 12) {
        chanceDeVender = 0.60; 
     }
      
      if (Math.random() <= chanceDeVender) {
        
        const quantidade = randomInt(1, 5);
        
        const valorLiquido = produto.preco_venda_unitario * quantidade;
        
        const estoque = randomInt(10, 200);

        const linha = [
          dataAtual,
          loja.id,
          produto.departamento,
          produto.marca,
          produto.fornecedor_id,
          produto.cod_produto,
          produto.nome_produto,
          quantidade,
          produto.custo_produto_unitario.toFixed(2),
          valorLiquido.toFixed(2),
          estoque
        ];
        
        linhasCsv.push(linha.join(','));
        totalLinhas++;
      }
    }
  }
  if (d.getDate() === 1) {
    console.log(`Processando mês ${d.getMonth() + 1}/${d.getFullYear()}... Linhas geradas: ${totalLinhas}`);
  }
}

const filePath = path.join(__dirname, 'vendas_ficticias.csv');
fs.writeFileSync(filePath, linhasCsv.join('\n'));

console.log('--- GERAÇÃO CONCLUÍDA ---');
console.log(`Arquivo "vendas_ficticias.csv" criado com ${totalLinhas} linhas de dados.`);
console.log(`Caminho: ${filePath}`);