-- CreateTable
CREATE TABLE "predios" (
    "id" SERIAL NOT NULL,
    "nome_predio" VARCHAR(150) NOT NULL,
    "descricao" VARCHAR(255),

    CONSTRAINT "predios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locais" (
    "id" SERIAL NOT NULL,
    "nome_local" VARCHAR(255) NOT NULL,
    "predio_id" INTEGER NOT NULL,

    CONSTRAINT "locais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" SERIAL NOT NULL,
    "nome_grupo" VARCHAR(100) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome_categoria" VARCHAR(100) NOT NULL,
    "grupo_id" INTEGER,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "marca" VARCHAR(100) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" SERIAL NOT NULL,
    "patrimonio" VARCHAR(50) NOT NULL,
    "capacidade" DECIMAL(10,2) NOT NULL,
    "unidade_medida" VARCHAR(50) NOT NULL,
    "valor_bem" DECIMAL(10,2) NOT NULL,
    "situacao" VARCHAR(50) NOT NULL,
    "tipo" VARCHAR(100),
    "modelo" VARCHAR(100),
    "categoria_id" INTEGER NOT NULL,
    "marca_id" INTEGER NOT NULL,
    "local_id" INTEGER NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" SERIAL NOT NULL,
    "razao_social" VARCHAR(150) NOT NULL,
    "cnpj" VARCHAR(30) NOT NULL,
    "telefone" VARCHAR(50),
    "email" VARCHAR(100),

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manutencoes" (
    "id" SERIAL NOT NULL,
    "data" DATE NOT NULL,
    "nota_fiscal" VARCHAR(100) NOT NULL,
    "solicitacao" INTEGER NOT NULL,
    "finalizado" BOOLEAN NOT NULL DEFAULT false,
    "forma_aquisicao" VARCHAR(100),
    "tipo_manutencao" VARCHAR(100),
    "observacoes" TEXT,
    "fornecedor_id" INTEGER NOT NULL,

    CONSTRAINT "manutencoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_manutencao" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "valor_unitario" DECIMAL(10,2) NOT NULL,
    "equipamento_id" INTEGER NOT NULL,
    "manutencao_id" INTEGER NOT NULL,

    CONSTRAINT "itens_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_patrimonio_key" ON "equipamentos"("patrimonio");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

-- AddForeignKey
ALTER TABLE "locais" ADD CONSTRAINT "locais_predio_id_fkey" FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "locais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manutencoes" ADD CONSTRAINT "manutencoes_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_manutencao" ADD CONSTRAINT "itens_manutencao_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_manutencao" ADD CONSTRAINT "itens_manutencao_manutencao_id_fkey" FOREIGN KEY ("manutencao_id") REFERENCES "manutencoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
