import React, { useState, useEffect } from 'react';
import { FaBookOpen, FaVideo } from 'react-icons/fa';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const BookIcon = FaBookOpen as React.ElementType;
const VideoIcon = FaVideo as React.ElementType;

// --- ESTRUTURA DE DADOS COMPLETA DO MANUAL ---
const manualData = [
    {
        slug: 'introducao',
        title: 'Introdução e Visão Geral',
        content: `
            <p class="mb-4">Este documento descreve a arquitetura e as funcionalidades do sistema de gestão integrado, desenvolvido para otimizar a operação de oficinas de estética automotiva. A plataforma foi construída com o objetivo de centralizar a gestão de clientes, serviços, finanças e estoque, utilizando tecnologias modernas para automatizar processos e fornecer insights inteligentes.</p>
            <h4 class="text-lg font-bold mb-2 text-texto-principal">Arquitetura Tecnológica:</h4>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Frontend:</strong> Desenvolvido em React com TypeScript, utilizando a biblioteca de componentes Tailwind CSS para uma interface moderna e responsiva.</li>
                <li><strong>Backend:</strong> Construído em Node.js com o framework Express e TypeScript, garantindo um servidor robusto, seguro e escalável.</li>
                <li><strong>Base de Dados:</strong> MySQL, escolhido pela sua fiabilidade e performance para armazenar de forma segura todos os dados da aplicação.</li>
                <li><strong>Inteligência Artificial:</strong> Integração com a API do Google Gemini para funcionalidades avançadas de marketing e análise financeira.</li>
                <li><strong>API Fiscal:</strong> Estruturado para se integrar com APIs de terceiros (como NFE.io) para a emissão simplificada de documentos fiscais (NFS-e, NFC-e).</li>
            </ul>
        `
    },
    {
        slug: 'gestao',
        title: 'Gestão e Operações',
        content: `
            <p class="mb-4">Esta é a área principal do sistema, o coração da sua operação. Aqui, o dono da loja e os seus funcionários gerem todo o negócio de forma centralizada e eficiente.</p>
            <h4 class="text-lg font-bold mb-2 text-texto-principal">Dashboard de Análise:</h4>
            <p class="mb-4">A tela inicial do administrador. Apresenta gráficos e KPIs que permitem uma visão rápida da saúde do negócio.</p>
            <h4 class="text-lg font-bold mb-2 text-texto-principal">Quadro OS (Kanban):</h4>
            <p class="mb-4">Um quadro visual para gerir o fluxo de Ordens de Serviço em tempo real. Os cards podem ser arrastados e largados entre as colunas.</p>
            <h4 class="text-lg font-bold mb-2 text-texto-principal">Orçamentos Kanban:</h4>
            <p class="mb-4">Um quadro dedicado à gestão do fluxo de orçamentos, com alertas visuais para propostas que necessitam de atenção.</p>
            <h4 class="text-lg font-bold mb-2 text-texto-principal">Agenda Visual:</h4>
            <p class="mb-4">Um calendário completo onde todas as Ordens de Serviço são exibidas visualmente, permitindo uma visão clara da ocupação da oficina.</p>
        `
    },
    {
        slug: 'checklist',
        title: 'Check-in e Check-out de Veículos',
        content: `
            <p class="mb-4">Uma das funcionalidades mais importantes para a segurança, transparência e profissionalismo da loja. O checklist digital elimina o papel e cria um registo permanente e indiscutível do estado do veículo.</p>
            <h4 class="text-lg font-bold mb-2 text-texto-principal">Fluxo do Processo:</h4>
            <ol class="list-decimal list-inside space-y-2 mb-4">
                <li>Na tela da OS, o botão <strong>"Realizar Check-in"</strong> leva para uma página de vistoria.</li>
                <li>O funcionário utiliza um <strong>diagrama visual de um carro</strong> para marcar avarias (riscos, mossas, etc.) diretamente no ecrã.</li>
                <li>É preenchida uma lista de itens a verificar, incluindo a <strong>quilometragem do veículo</strong>.</li>
                <li>O cliente <strong>assina digitalmente no ecrã</strong>, concordando com a vistoria.</li>
                <li>Após a finalização da OS, o processo é repetido para o <strong>Check-out</strong>.</li>
            </ol>
        `
    },
    {
        slug: 'estoque',
        title: 'Produtos e Estoque',
        content: `
            <p class="mb-4">Um módulo completo para a gestão de inventário, garantindo que você nunca perca uma venda por falta de produto.</p>
            <h4 class="text-lg font-bold mb-2 text-texto-principal">Funcionalidades Principais:</h4>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Cadastro de Produtos e Serviços:</strong> Telas dedicadas para o registo detalhado de todos os itens que a loja oferece.</li>
                <li><strong>Baixa Automática:</strong> Ao finalizar uma OS, o sistema dá baixa automática dos produtos utilizados no estoque.</li>
                <li><strong>Fechamento de Estoque (Inventário):</strong> Uma ferramenta poderosa para a contagem e ajuste do seu inventário físico através do upload de planilhas.</li>
                <li><strong>Relatórios de Estoque:</strong> Inclui Posição do Estoque, Auditoria de Movimentações e Curva ABC para análise de faturamento.</li>
            </ul>
        `
    },
    {
        slug: 'financeiro',
        title: 'Módulo Financeiro',
        content: `
            <p class="mb-4">Controle total sobre as finanças do seu negócio, desde o fluxo diário até análises de rentabilidade.</p>
            <h4 class="text-lg font-bold mb-2 text-texto-principal">Ferramentas Financeiras:</h4>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Contas a Pagar e a Receber:</strong> Telas para registar todas as despesas e receitas, com geração automática ao finalizar uma OS.</li>
                <li><strong>Fluxo de Caixa:</strong> Um relatório com um gráfico que mostra a evolução diária das receitas e despesas.</li>
                <li><strong>DRE (Demonstrativo de Resultado):</strong> Um relatório completo que calcula a Receita Bruta, Custos, Despesas e o Lucro Líquido Final.</li>
                <li><strong>Análise do DRE com IA:</strong> Um botão que envia os dados financeiros para a IA do Google, que retorna uma análise com insights e sugestões de melhoria.</li>
            </ul>
        `
    },
    {
        slug: 'crm',
        title: 'CRM e Pós-Venda Inteligente',
        content: `
            <p class="mb-4">Ferramentas desenhadas para fidelizar clientes e aumentar as vendas recorrentes através de um atendimento personalizado e inteligente.</p>
            <h4 class="text-lg font-bold mb-2 text-texto-principal">Funcionalidades de Relacionamento:</h4>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Histórico Completo por Placa:</strong> Pesquise uma placa e veja instantaneamente todo o histórico do cliente e do veículo.</li>
                <li><strong>Sugestões de Venda com IA:</strong> Analise o perfil de consumo do cliente e gere uma oferta personalizada com um clique.</li>
                <li><strong>Marketing com IA:</strong> Descreva um objetivo de marketing e a IA gera um texto de e-mail profissional, pronto a ser enviado.</li>
            </ul>
        `
    },
    {
        slug: 'portal_cliente',
        title: 'Portal do Cliente',
        content: `
            <p class="mb-4">Uma área dedicada para que o cliente da oficina possa gerir os seus serviços de forma autónoma, melhorando a sua experiência e reduzindo a carga de trabalho administrativo da loja.</p>
            <h4 class="text-lg font-bold mb-2 text-texto-principal">Funcionalidades do Cliente:</h4>
            <ul class="list-disc list-inside space-y-2 mb-4">
                <li><strong>Navegação Moderna:</strong> Um menu lateral retrátil otimizado para qualquer dispositivo.</li>
                <li><strong>Vitrine da Loja:</strong> Visualize serviços, promoções e vídeos de cada estabelecimento.</li>
                <li><strong>Solicitação de Orçamento:</strong> O cliente pode descrever o que precisa e anexar fotos para solicitar um orçamento.</li>
                <li><strong>Gestão de Orçamentos:</strong> Aprove, solicite alterações ou cancele orçamentos com assinatura digital.</li>
                <li><strong>Histórico de Serviços:</strong> Consulte e descarregue um PDF de todas as Ordens de Serviço já concluídas.</li>
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

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const videosRef = collection(db, 'manuais_videos');
                const snapshot = await getDocs(videosRef);
                const videosMap = snapshot.docs.reduce((acc, doc) => {
                    const data = doc.data();
                    acc[data.slug] = data.url_video;
                    return acc;
                }, {} as { [key: string]: string });
                setVideoUrls(videosMap);
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