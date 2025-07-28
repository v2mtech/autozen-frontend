// Interface para padronizar a estrutura dos nossos objetos de código
interface FiscalCode {
    codigo: string;
    descricao: string;
}

export const cstIcms: FiscalCode[] = [
    { codigo: '00', descricao: 'Tributada integralmente' },
    { codigo: '10', descricao: 'Tributada e com cobrança do ICMS por substituição tributária' },
    { codigo: '20', descricao: 'Com redução de base de cálculo' },
    { codigo: '30', descricao: 'Isenta ou não tributada e com cobrança do ICMS por ST' },
    { codigo: '40', descricao: 'Isenta' },
    { codigo: '41', descricao: 'Não tributada' },
    { codigo: '50', descricao: 'Suspensão' },
    { codigo: '51', descricao: 'Diferimento' },
    { codigo: '60', descricao: 'ICMS cobrado anteriormente por substituição tributária' },
    { codigo: '70', descricao: 'Com redução de base de cálculo e cobrança do ICMS por ST' },
    { codigo: '90', descricao: 'Outras' },
];

export const cstPisCofins: FiscalCode[] = [
    { codigo: '01', descricao: 'Operação Tributável com Alíquota Básica' },
    { codigo: '02', descricao: 'Operação Tributável com Alíquota Diferenciada' },
    { codigo: '03', descricao: 'Operação Tributável com Alíquota por Unidade de Medida' },
    { codigo: '04', descricao: 'Operação Tributável Monofásica - Revenda a Alíquota Zero' },
    { codigo: '05', descricao: 'Operação Tributável por Substituição Tributária' },
    { codigo: '06', descricao: 'Operação Tributável a Alíquota Zero' },
    { codigo: '07', descricao: 'Operação Isenta da Contribuição' },
    { codigo: '08', descricao: 'Operação sem Incidência da Contribuição' },
    { codigo: '09', descricao: 'Operação com Suspensão da Contribuição' },
    { codigo: '49', descricao: 'Outras Operações de Saída' },
    { codigo: '50', descricao: 'Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Tributada' },
    { codigo: '70', descricao: 'Operação de Aquisição sem Direito a Crédito' },
    { codigo: '99', descricao: 'Outras Operações' },
];

export const cstIpi: FiscalCode[] = [
    // Entradas
    { codigo: '00', descricao: 'Entrada com Recuperação de Crédito' },
    { codigo: '01', descricao: 'Entrada Tributável com Alíquota Zero' },
    { codigo: '02', descricao: 'Entrada Isenta' },
    { codigo: '03', descricao: 'Entrada Não-Tributada' },
    { codigo: '04', descricao: 'Entrada Imune' },
    { codigo: '05', descricao: 'Entrada com Suspensão' },
    { codigo: '49', descricao: 'Outras Entradas' },
    // Saídas
    { codigo: '50', descricao: 'Saída Tributada' },
    { codigo: '51', descricao: 'Saída Tributável com Alíquota Zero' },
    { codigo: '52', descricao: 'Saída Isenta' },
    { codigo: '53', descricao: 'Saída Não-Tributada' },
    { codigo: '54', descricao: 'Saída Imune' },
    { codigo: '55', descricao: 'Saída com Suspensão' },
    { codigo: '99', descricao: 'Outras Saídas' },
];

export const cfopCodes: FiscalCode[] = [
    // Vendas de Mercadorias
    { codigo: '5101', descricao: 'Venda de produção do estabelecimento' },
    { codigo: '5102', descricao: 'Venda de mercadoria de terceiros' },
    { codigo: '6101', descricao: 'Venda de produção do estabelecimento (Outro Estado)' },
    { codigo: '6102', descricao: 'Venda de mercadoria de terceiros (Outro Estado)' },
    { codigo: '5405', descricao: 'Venda de mercadoria (substituição tributária)' },
    // Devoluções de Compras
    { codigo: '5201', descricao: 'Devolução de compra para industrialização' },
    { codigo: '5202', descricao: 'Devolução de compra para comercialização' },
    { codigo: '6202', descricao: 'Devolução de compra para comercialização (Outro Estado)' },
    // Retornos e Remessas
    { codigo: '5901', descricao: 'Remessa para industrialização por encomenda' },
    { codigo: '5902', descricao: 'Retorno de mercadoria (industrialização por encomenda)' },
    { codigo: '5915', descricao: 'Remessa de mercadoria para conserto ou reparo' },
    { codigo: '5916', descricao: 'Retorno de mercadoria (conserto ou reparo)' },
    // Outros
    { codigo: '5949', descricao: 'Outra saída de mercadoria não especificada' },
    { codigo: '5900', descricao: 'Outras saídas de mercadorias ou prestação de serviços' },
    { codigo: '6949', descricao: 'Outra saída de mercadoria não especificada (Outro Estado)' },
];

export const cestCodes: FiscalCode[] = [
    // Itens que já existiam
    { codigo: '01.001.00', descricao: 'Cervejas de malte' },
    { codigo: '01.002.00', descricao: 'Chope' },
    { codigo: '01.003.00', descricao: 'Refrigerantes' },
    // Novos itens automotivos
    { codigo: '01.090.00', descricao: 'Películas adesivas automotivas (inclui PPF)' },
    { codigo: '28.038.00', descricao: 'Cera, massa de polir e preparações para brilho' },
    // Outros itens para contexto
    { codigo: '10.001.00', descricao: 'Pneumáticos novos de borracha' },
    { codigo: '13.001.00', descricao: 'Medicamentos de uso humano' },
    { codigo: '17.001.00', descricao: 'Alimentos para animais de estimação' },
    { codigo: '20.001.00', descricao: 'Cosméticos e perfumaria' },
    { codigo: '21.001.00', descricao: 'Artigos de papelaria' },
    { codigo: '23.001.00', descricao: 'Telefones celulares e smartphones' },
    { codigo: '01.999.00', descricao: 'Outras peças e acessórios para veículos' },
];

export const regimesTributarios = [
    { valor: 'simples_nacional', nome: 'Simples Nacional' },
    { valor: 'simples_nacional_excesso', nome: 'Simples Nacional – excesso de sublimite de receita bruta' },
    { valor: 'lucro_presumido', nome: 'Lucro Presumido' },
    { valor: 'lucro_real', nome: 'Lucro Real' },
    { valor: 'mei', nome: 'MEI - Microempreendedor Individual' },
];