import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🔄 Iniciando processo de Seed...');

  const jsonPath = path.resolve(__dirname, '../dados_manutencao.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo de dados não encontrado em: ${jsonPath}`);
  }

  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📦 Registros lidos do JSON: ${rawData.length}`);

  const predios = [];
  const locais = [];
  const grupos = [];
  const categorias = [];
  const marcas = [];
  const fornecedores = [];
  const equipamentos = [];
  const manutencoes = [];
  const itensManutencao = [];

  for (const item of rawData) {
    const { model, pk, fields } = item;

    switch (model) {
      case 'app_manutencao.predio':
        predios.push({
          id: pk,
          nome_predio: fields.nome_predio,
          descricao: fields.descricao || null,
        });
        break;

      case 'app_manutencao.local':
        locais.push({
          id: pk,
          nome_local: fields.nome_local,
          predio_id: fields.predio,
        });
        break;

      case 'app_manutencao.grupo':
        grupos.push({
          id: pk,
          nome_grupo: fields.nome_grupo,
        });
        break;

      case 'app_manutencao.categoria':
        categorias.push({
          id: pk,
          nome_categoria: fields.nome_categoria,
          grupo_id: fields.grupo || null,
        });
        break;

      case 'app_manutencao.marca':
        marcas.push({
          id: pk,
          marca: fields.marca,
        });
        break;

      case 'app_manutencao.fornecedor':
        fornecedores.push({
          id: pk,
          razao_social: fields.razao_social,
          cnpj: fields.cnpj,
          telefone: fields.telefone || null,
          email: fields.email || null,
        });
        break;

      case 'app_manutencao.equipamento':
        equipamentos.push({
          id: pk,
          patrimonio: fields.patrimonio,
          capacidade: parseFloat(fields.capacidade) || 0,
          unidade_medida: fields.unidade_medida,
          valor_bem: parseFloat(fields.valor_bem) || 0,
          situacao: fields.situacao,
          tipo: fields.tipo || null,
          modelo: fields.modelo || null,
          categoria_id: fields.categoria,
          marca_id: fields.marca,
          local_id: fields.local,
        });
        break;

      case 'app_manutencao.manutencao':
        manutencoes.push({
          id: pk,
          data: new Date(fields.data),
          nota_fiscal: fields.nota_fiscal,
          solicitacao: fields.solicitacao,
          finalizado: Boolean(fields.finalizado),
          forma_aquisicao: fields.forma_aquisicao || null,
          tipo_manutencao: fields.tipo_manutencao || null,
          observacoes: fields.observacoes || null,
          fornecedor_id: fields.fornecedor,
        });
        break;

      case 'app_manutencao.itemmanutencao':
        itensManutencao.push({
          id: pk,
          descricao: fields.descricao,
          quantidade: parseFloat(fields.quantidade) || 1,
          valor_unitario: parseFloat(fields.valor_unitario) || 0,
          equipamento_id: fields.equipamento,
          manutencao_id: fields.manutencao,
        });
        break;

      default:
        break;
    }
  }

  console.log('🧹 Limpando dados antigos...');
  await prisma.itemManutencao.deleteMany();
  await prisma.manutencao.deleteMany();
  await prisma.equipamento.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.marca.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.local.deleteMany();
  await prisma.predio.deleteMany();

  console.log('📥 Inserindo Prédios...');
  if (predios.length > 0) await prisma.predio.createMany({ data: predios });

  console.log('📥 Inserindo Grupos...');
  if (grupos.length > 0) await prisma.grupo.createMany({ data: grupos });

  console.log('📥 Inserindo Marcas...');
  if (marcas.length > 0) await prisma.marca.createMany({ data: marcas });

  console.log('📥 Inserindo Locais...');
  if (locais.length > 0) await prisma.local.createMany({ data: locais });

  console.log('📥 Inserindo Categorias...');
  if (categorias.length > 0)
    await prisma.categoria.createMany({ data: categorias });

  console.log('📥 Inserindo Fornecedores...');
  if (fornecedores.length > 0)
    await prisma.fornecedor.createMany({ data: fornecedores });

  console.log('📥 Inserindo Equipamentos...');
  if (equipamentos.length > 0)
    await prisma.equipamento.createMany({ data: equipamentos });

  console.log('📥 Inserindo Manutenções...');
  if (manutencoes.length > 0)
    await prisma.manutencao.createMany({ data: manutencoes });

  console.log('📥 Inserindo Itens de Manutenção...');
  if (itensManutencao.length > 0)
    await prisma.itemManutencao.createMany({ data: itensManutencao });

  console.log('🔢 Sincronizando sequências do PostgreSQL...');
  const tables = [
    { table: 'predios', seq: 'predios_id_seq' },
    { table: 'locais', seq: 'locais_id_seq' },
    { table: 'grupos', seq: 'grupos_id_seq' },
    { table: 'categorias', seq: 'categorias_id_seq' },
    { table: 'marcas', seq: 'marcas_id_seq' },
    { table: 'fornecedores', seq: 'fornecedores_id_seq' },
    { table: 'equipamentos', seq: 'equipamentos_id_seq' },
    { table: 'manutencoes', seq: 'manutencoes_id_seq' },
    { table: 'itens_manutencao', seq: 'itens_manutencao_id_seq' },
  ];

  for (const item of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${item.table}"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "${item.table}";`,
    );
  }

  console.log('✅ Seed finalizado com total sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a execução da seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
