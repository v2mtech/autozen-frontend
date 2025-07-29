import React, { useState, useEffect } from 'react';
import { FaBookOpen, FaVideo } from 'react-icons/fa';
import api from '../../services/api';

const BookIcon = FaBookOpen as React.ElementType;
const VideoIcon = FaVideo as React.ElementType;

// --- ESTRUTURA DE DADOS DO MANUAL ---
const manualData = [
    {
        slug: 'introducao',
        title: 'Introdução e Visão Geral',
        content: `
            <p class="mb-4">Este documento descreve a arquitetura e as funcionalidades do sistema de gestão integrado, desenvolvido para otimizar a operação de oficinas de estética automotiva. A plataforma foi construída com o objetivo de centralizar a gestão de clientes, serviços, finanças e estoque, utilizando tecnologias modernas para automatizar processos e fornecer insights inteligentes.</p>
            <h4 class="text-lg font-bold mb-2 text-white">Arquitetura Tecnológica:</h4>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Frontend:</strong> Desenvolvido em React com TypeScript, utilizando a biblioteca de componentes Tailwind CSS para uma interface moderna e responsiva. Garante uma experiência de utilizador fluida em qualquer dispositivo, seja um computador de secretária ou um telemóvel.</li>
                <li><strong>Backend:</strong> Construído em Node.js com o framework Express e TypeScript, garantindo um servidor robusto, seguro e escalável para lidar com todas as operações da sua loja.</li>
                <li><strong>Base de Dados:</strong> MySQL, escolhido pela sua fiabilidade e performance para armazenar de forma segura todos os dados da aplicação, desde informações de clientes a transações financeiras.</li>
                <li><strong>Inteligência Artificial:</strong> Integração com a API do Google Gemini para funcionalidades avançadas de marketing e análise financeira, transformando dados brutos em estratégias acionáveis.</li>
                <li><strong>API Fiscal:</strong> Estruturado para se integrar com APIs de terceiros (como NFE.io) para a emissão simplificada de documentos fiscais (NFS-e, NFC-e), mantendo o seu negócio em conformidade.</li>
            </ul>
        `
    },
    {
        slug: 'gestao',
        title: 'Gestão e Operações',
        content: `
            <p class="mb-4">Esta é a área principal do sistema, o coração da sua operação. Aqui, o dono da loja e os seus funcionários gerem todo o negócio de forma centralizada e eficiente.</p>
            <h4 class="text-lg font-bold mb-2 text-white">Dashboard de Análise:</h4>
            <p class="mb-4">A tela inicial do administrador. Apresenta gráficos e indicadores-chave de performance (KPIs) num período selecionado, permitindo uma visão rápida da saúde do negócio. Inclui:</p>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Faturamento Total:</strong> O valor bruto de todas as vendas no período.</li>
                <li><strong>Recebimentos por Forma de Pagamento:</strong> Um gráfico em formato de "donut" que mostra quais formas de pagamento (dinheiro, PIX, cartão) são mais utilizadas.</li>
                <li><strong>Orçamentos Aprovados por Dia:</strong> Um gráfico de linhas que ilustra a sua taxa de conversão de orçamentos em serviços.</li>
                <li><strong>Serviços Mais Realizados:</strong> Identifique rapidamente os seus serviços mais populares.</li>
                <li><strong>Desempenho por Funcionário:</strong> Veja quais funcionários estão a realizar mais serviços.</li>
            </ul>
            <h4 class="text-lg font-bold mb-2 text-white">Quadro OS (Kanban):</h4>
            <p class="mb-4">Um quadro visual para gerir o fluxo de Ordens de Serviço em tempo real. Os cards podem ser arrastados e largados entre as colunas, refletindo o estado atual de cada serviço. As colunas são: <strong>Agendado, Em Execução, Aguardando Cliente, Aguardando Peças, Histórico (Concluídos/Cancelados)</strong>. Cada card exibe o nome do cliente, os serviços e um ícone para contactar o cliente via WhatsApp com uma mensagem pré-definida.</p>
            <h4 class="text-lg font-bold mb-2 text-white">Orçamentos Kanban:</h4>
            <p class="mb-4">Um quadro dedicado à gestão do fluxo de orçamentos. As colunas são: <strong>Solicitações, Aguardando Cliente, Aprovados, Cancelados</strong>. Orçamentos que foram devolvidos pelo cliente com pedidos de alteração aparecem na primeira coluna com um ícone de alerta, indicando que precisam de atenção imediata.</p>
            <h4 class="text-lg font-bold mb-2 text-white">Agenda Visual:</h4>
            <p class="mb-4">Um calendário completo onde todas as Ordens de Serviço são exibidas visualmente, permitindo uma visão clara da ocupação da oficina por dia, semana ou mês. Ideal para evitar sobreposições e otimizar o agendamento de novos clientes.</p>
        `
    },
    {
        slug: 'checklist',
        title: 'Check-in e Check-out de Veículos',
        content: `
            <p class="mb-4">Uma das funcionalidades mais importantes para a segurança, transparência e profissionalismo da loja. O checklist digital elimina o papel e cria um registo permanente e indiscutível do estado do veículo.</p>
            <h4 class="text-lg font-bold mb-2 text-white">Fluxo do Processo:</h4>
            <ol class="list-decimal list-inside space-y-2 mb-4">
                <li>Na tela da OS, o botão <strong>"Realizar Check-in"</strong> leva para uma página de vistoria.</li>
                <li>O funcionário utiliza um <strong>diagrama visual de um carro</strong> (visto de cima) para marcar avarias (riscos, mossas, etc.) diretamente no ecrã de um tablet ou telemóvel. Cada ponto marcado pode receber uma descrição.</li>
                <li>É preenchida uma lista de itens a verificar (nível de combustível, tapetes, rádio, triângulo de segurança, etc.).</li>
                <li>O cliente <strong>assina digitalmente no ecrã</strong> do dispositivo, concordando com a vistoria inicial.</li>
                <li>Após a finalização da OS, o botão <strong>"Realizar Check-out"</strong> fica disponível. O processo é repetido para verificar os mesmos itens.</li>
                <li>O cliente assina novamente, confirmando a receção do veículo nas condições esperadas.</li>
            </ol>
            <h4 class="text-lg font-bold mb-2 text-white">Relatórios e Segurança:</h4>
            <p class="mb-4">Todos os relatórios de check-in e check-out (com as marcações no diagrama, lista de itens e assinaturas) ficam permanentemente anexados à Ordem de Serviço, podendo ser consultados a qualquer momento para resolver disputas ou confirmar o estado do veículo.</p>
        `
    },
    {
        slug: 'estoque',
        title: 'Produtos e Estoque',
        content: `
            <p class="mb-4">Um módulo completo para a gestão de inventário, garantindo que você nunca perca uma venda por falta de produto.</p>
             <h4 class="text-lg font-bold mb-2 text-white">Funcionalidades Principais:</h4>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Cadastro de Produtos e Serviços:</strong> Telas dedicadas para o registo detalhado de todos os produtos e serviços que a loja oferece, incluindo a associação a Grupos e Fornecedores.</li>
                <li><strong>Controlo de Estoque por Loja:</strong> Cada loja tem o seu próprio estoque. Ao criar um produto e definir um estoque mínimo, o sistema cria automaticamente o seu registo de estoque com quantidade zero.</li>
                <li><strong>Baixa Automática:</strong> Quando uma OS que contém produtos é finalizada, o sistema dá baixa automática das quantidades vendidas no estoque, mantendo os seus números sempre atualizados.</li>
            </ul>
            <h4 class="text-lg font-bold mb-2 text-white">Fechamento de Estoque (Inventário):</h4>
            <p class="mb-4">Uma ferramenta poderosa para a contagem e ajuste do seu inventário físico.</p>
            <ol class="list-decimal list-inside space-y-2 mb-4">
                <li>O utilizador exporta uma planilha (.xlsx ou .csv) com a lista de produtos da sua loja.</li>
                <li>Após a contagem física, ele preenche a coluna "CONTAGEM" e faz o upload do ficheiro.</li>
                <li>O sistema exibe um modal com a análise das diferenças entre o estoque do sistema e a contagem.</li>
                <li>O utilizador pode escolher entre <strong>Fechar Estoque (Botão Verde)</strong>, que força o estoque a ser igual à contagem, ou <strong>Corrigir Estoque (Botão Amarelo)</strong>, que lança apenas as perdas como uma "venda não registada".</li>
            </ol>
             <h4 class="text-lg font-bold mb-2 text-white">Relatórios de Estoque:</h4>
             <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Posição do Estoque:</strong> Uma lista completa de todos os produtos com o seu código, grupo e quantidade atual.</li>
                <li><strong>Auditoria de Estoque:</strong> Um histórico detalhado de todas as movimentações (entradas, saídas, vendas, ajustes) para cada produto.</li>
                <li><strong>Curva ABC:</strong> Um relatório que classifica os produtos em A, B e C com base no seu impacto no faturamento, ajudando a loja a focar-se nos itens mais importantes.</li>
             </ul>
        `
    },
    {
        slug: 'financeiro',
        title: 'Módulo Financeiro',
        content: `
            <p class="mb-4">Controle total sobre as finanças do seu negócio, desde o fluxo diário até análises de rentabilidade.</p>
            <h4 class="text-lg font-bold mb-2 text-white">Ferramentas Financeiras:</h4>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Contas a Pagar e a Receber:</strong> Telas para registar todas as despesas (aluguer, salários, fornecedores) e receitas. As receitas são criadas automaticamente quando uma OS é finalizada, garantindo que nenhum recebimento seja esquecido.</li>
                <li><strong>Fluxo de Caixa:</strong> Um relatório com um gráfico de linhas que mostra a evolução diária das receitas e despesas, permitindo uma visão clara da saúde financeira do negócio.</li>
                <li><strong>DRE (Demonstrativo de Resultado do Exercício):</strong> Um relatório financeiro completo que calcula a Receita Bruta, Custos, Despesas e o Lucro Líquido Final, mostrando a verdadeira rentabilidade da sua oficina.</li>
            </ul>
             <h4 class="text-lg font-bold mb-2 text-white">Análise do DRE com IA:</h4>
             <p class="mb-4">Um botão na tela do DRE envia os dados financeiros para a IA do Google (Gemini), que retorna uma análise com insights e sugestões de melhoria para o negócio, como "A sua margem de lucro em serviços está abaixo da média do setor. Considere rever o custo dos seus serviços ou ajustar os preços."</p>
        `
    },
    {
        slug: 'crm',
        title: 'CRM e Pós-Venda Inteligente',
        content: `
            <p class="mb-4">Ferramentas desenhadas para fidelizar clientes e aumentar as vendas recorrentes através de um atendimento personalizado e inteligente.</p>
            <h4 class="text-lg font-bold mb-2 text-white">Funcionalidades de Relacionamento:</h4>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Histórico Completo por Placa:</strong> Uma tela de pesquisa onde o administrador pode inserir uma placa de veículo e ver instantaneamente todo o histórico associado: dados do cliente, todas as OS e todos os orçamentos já realizados.</li>
                <li><strong>Sugestões de Venda com IA:</strong> Dentro da tela de histórico, um botão "Gerar Sugestão com IA" analisa o perfil de consumo do cliente e sugere uma oferta personalizada (ex: "Este cliente já fez 3 polimentos, mas nunca aplicou película. Sugira um pacote de polimento + película com 15% de desconto.").</li>
                <li><strong>Marketing com IA:</strong> Uma página onde o administrador descreve um objetivo de marketing (ex: "promover a limpeza de estofos para o inverno") e a IA do Google gera um texto de e-mail profissional, pronto a ser enviado.</li>
            </ul>
        `
    },
    {
        slug: 'portal_cliente',
        title: 'Portal do Cliente',
        content: `
            <p class="mb-4">Uma área dedicada para que o cliente da oficina possa gerir os seus serviços de forma autónoma, melhorando a sua experiência e reduzindo a carga de trabalho administrativo da loja.</p>
            <h4 class="text-lg font-bold mb-2 text-white">Funcionalidades do Cliente:</h4>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Menu Lateral Retrátil:</strong> A navegação é feita através de um menu moderno que inicia fechado (apenas com ícones) e expande ao ser clicado, otimizando o espaço em dispositivos móveis.</li>
                <li><strong>Lojas e Detalhes:</strong> O cliente pode ver a lista de lojas disponíveis e aceder a uma vitrine de cada uma, mostrando os seus serviços, promoções de cashback ativas e vídeos do YouTube.</li>
                <li><strong>Solicitação de Orçamento:</strong> O cliente pode descrever o que precisa, anexar fotos e solicitar um orçamento diretamente à loja.</li>
                <li><strong>Gestão de Orçamentos:</strong> Numa lista centralizada, o cliente pode <strong>Aprovar</strong> (convertendo o orçamento numa OS agendada com assinatura digital), <strong>Solicitar Alteração</strong>, ou <strong>Cancelar</strong> os seus orçamentos.</li>
                <li><strong>Minhas Ordens de Serviço:</strong> Uma nova página dedicada a listar apenas os serviços concluídos, onde o cliente pode clicar para gerar e descarregar um PDF profissional da sua OS a qualquer momento.</li>
                <li><strong>Meus Agendamentos:</strong> Uma lista de serviços que estão agendados mas ainda não foram concluídos, permitindo ao cliente acompanhar os seus próximos compromissos.</li>
            </ul>
        `
    }
];

const VideoPlayer = ({ url }: { url: string }) => {
    const getEmbedUrl = (videoUrl: string) => {
        try {
            const urlObj = new URL(videoUrl);
            let videoId = urlObj.searchParams.get('v');
            if (urlObj.hostname === 'youtu.be') {
                videoId = urlObj.pathname.substring(1);
            }
            return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
        } catch (e) {
            return '';
        }
    };

    const embedUrl = getEmbedUrl(url);

    if (!embedUrl) {
        return <p className="text-sm text-yellow-500">URL do YouTube inválida ou não reconhecida.</p>;
    }

    return (
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
                src={embedUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-lg"
            ></iframe>
        </div>
    );
};

export default function ManuaisPage() {
    const [activeTab, setActiveTab] = useState(manualData[0].slug);
    const [videoUrls, setVideoUrls] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);

    // ✅ EFEITO PARA BUSCAR OS VÍDEOS DO BANCO DE DADOS
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await api.get('/manuais/videos');
                setVideoUrls(response.data);
            } catch (error) {
                console.error("Erro ao buscar vídeos do manual:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    const activeContent = manualData.find(item => item.slug === activeTab);

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <BookIcon size={40} className="text-primaria-padrao" />
                <h1 className="text-4xl font-bold text-texto-principal">Manual de Funcionamento do Sistema</h1>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Navegação em Abas */}
                <div className="w-full md:w-1/4">
                    <div className="flex flex-col space-y-2">
                        {manualData.map(item => (
                            <button
                                key={item.slug}
                                onClick={() => setActiveTab(item.slug)}
                                className={`p-4 text-left font-semibold rounded-lg transition-colors duration-200 ${activeTab === item.slug
                                        ? 'bg-primaria-padrao text-white shadow-lg'
                                        : 'bg-fundo-secundario text-texto-principal hover:bg-primaria-intermediario'
                                    }`}
                            >
                                {item.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conteúdo da Aba */}
                <div className="w-full md:w-3/4">
                    {activeContent && (
                        <div className="bg-fundo-secundario p-8 rounded-lg shadow-sm border border-borda">
                            <h2 className="text-3xl font-bold mb-4 text-texto-principal">{activeContent.title}</h2>
                            <div className="prose prose-invert max-w-none text-texto-secundario" dangerouslySetInnerHTML={{ __html: activeContent.content }} />

                            <hr className="border-borda my-8" />

                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-texto-principal flex items-center gap-3"><VideoIcon /> Vídeo Explicativo</h3>
                                {loading ? <p className="text-texto-secundario">A carregar vídeo...</p> :
                                    videoUrls[activeTab] ? (
                                        <VideoPlayer url={videoUrls[activeTab]} />
                                    ) : (
                                        <p className="text-texto-secundario p-4 bg-fundo-principal rounded-md">Nenhum vídeo de ajuda disponível para esta secção.</p>
                                    )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}