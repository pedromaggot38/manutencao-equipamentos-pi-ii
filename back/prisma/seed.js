import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/config/db.js';

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

  console.log('⚡ Executando migração em transação...');
  await prisma.$transaction(
    async (tx) => {
      console.log('🧹 Limpando dados antigos...');
      await tx.itemManutencao.deleteMany();
      await tx.manutencao.deleteMany();
      await tx.equipamento.deleteMany();
      await tx.fornecedor.deleteMany();
      await tx.marca.deleteMany();
      await tx.categoria.deleteMany();
      await tx.grupo.deleteMany();
      await tx.local.deleteMany();
      await tx.predio.deleteMany();

      console.log('📥 Inserindo dados...');
      if (predios.length > 0) await tx.predio.createMany({ data: predios });
      if (grupos.length > 0) await tx.grupo.createMany({ data: grupos });
      if (marcas.length > 0) await tx.marca.createMany({ data: marcas });
      if (locais.length > 0) await tx.local.createMany({ data: locais });
      if (categorias.length > 0)
        await tx.categoria.createMany({ data: categorias });
      if (fornecedores.length > 0)
        await tx.fornecedor.createMany({ data: fornecedores });
      if (equipamentos.length > 0)
        await tx.equipamento.createMany({ data: equipamentos });
      if (manutencoes.length > 0)
        await tx.manutencao.createMany({ data: manutencoes });
      if (itensManutencao.length > 0)
        await tx.itemManutencao.createMany({ data: itensManutencao });

      console.log('🔢 Sincronizando sequências do PostgreSQL...');
      const tables = [
        'predios',
        'locais',
        'grupos',
        'categorias',
        'marcas',
        'fornecedores',
        'equipamentos',
        'manutencoes',
        'itens_manutencao',
      ];

      for (const table of tables) {
        await tx.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "${table}";`,
        );
      }
    },
    {
      maxWait: 15000,
      timeout: 60000,
    },
  );

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
