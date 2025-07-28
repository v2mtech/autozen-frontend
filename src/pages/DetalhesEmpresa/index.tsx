import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';

// --- INTERFACES ---
interface Video { id: number; titulo: string; url_video: string; }
interface Empresa { id: number; nome_fantasia: string; endereco_cidade: string; endereco_estado: string; videos?: Video[]; }
interface Servico { id: number; nome: string; descricao: string; duracao_minutos: number; preco: number; }
interface PromocaoAtiva { id: number; descricao: string; }
interface Avaliacao { id: number; nota: number; comentario: string; criado_em: string; usuario_nome: string; }

// --- COMPONENTE AUXILIAR ---
const StarRating = ({ rating, size = 'text-xl' }: { rating: number; size?: string }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (<span key={star} className={`${size} ${rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>))}
    </div>
);

export default function DetalhesEmpresaPage() {
    const { id: empresaId } = useParams<{ id: string }>();

    // --- STATES ---
    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
    const [promocoesAtivas, setPromocoesAtivas] = useState<PromocaoAtiva[]>([]);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    const getEmbedUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            let videoId = urlObj.searchParams.get('v');
            if (!videoId && (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com')) {
                videoId = urlObj.pathname.split('/')[1];
            } else if (urlObj.hostname === 'youtu.be') {
                videoId = urlObj.pathname.substring(1);
            }
            return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
        } catch (e) { 
            console.error("URL de vídeo inválida:", url);
            return ''; 
        }
    };

    useEffect(() => {
        async function fetchPageData() {
            if (!empresaId) return;
            setIsPageLoading(true);
            setPageError('');
            try {
                const [empresaRes, servicosRes, avlsRes, promosRes] = await Promise.all([
                    api.get<Empresa>(`/empresas/${empresaId}`),
                    api.get<Servico[]>(`/empresas/${empresaId}/servicos`),
                    api.get<Avaliacao[]>(`/empresas/${empresaId}/avaliacoes`),
                    api.get<PromocaoAtiva[]>(`/empresas/${empresaId}/promocoes`),
                ]);

                setEmpresa(empresaRes.data);
                setServicos(servicosRes.data);
                setAvaliacoes(avlsRes.data);
                setPromocoesAtivas(promosRes.data);
            } catch (err) {
                console.error("Falha ao carregar dados da página:", err);
                setPageError('Não foi possível carregar os detalhes da empresa. Tente novamente mais tarde.');
            } finally {
                setIsPageLoading(false);
            }
        }
        fetchPageData();
    }, [empresaId]);

    const notaMedia = avaliacoes.length > 0 ? avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length : 0;

    if (isPageLoading) return <p className="text-gray-400 text-center p-10">A carregar detalhes da loja...</p>;
    if (pageError) return <p className="text-red-500 text-center p-10">{pageError}</p>;
    if (!empresa) return <p className="text-gray-400 text-center p-10">Empresa não encontrada.</p>;

    return (
        <div>
            {/* Seção do Cabeçalho e Promoções */}
            <div className="mb-2"><h1 className="text-4xl font-bold text-white">{empresa.nome_fantasia}</h1><p className="text-gray-400">{empresa.endereco_cidade}, {empresa.endereco_estado}</p></div>
            <div className="mb-8 flex items-center gap-3"><StarRating rating={notaMedia} /><span className="text-gray-400 text-sm font-semibold">{notaMedia.toFixed(1)}</span><span className="text-gray-500 text-sm">({avaliacoes.length} avaliações)</span></div>
            {promocoesAtivas.length > 0 && (<div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"><h2 className="text-xl font-bold text-yellow-400 mb-2">⭐ Promoções de Cashback Ativas</h2><ul className="list-disc list-inside text-yellow-300">{promocoesAtivas.map(p => <li key={p.id}>{p.descricao}</li>)}</ul></div>)}
            
            {/* Botão Fixo para Orçamento */}
            <div className="sticky top-4 z-10 my-6">
                <Link to="/solicitar-orcamento" state={{ empresaId: empresa.id, empresaNome: empresa.nome_fantasia }}>
                    <button className="w-full bg-primaria-padrao text-white text-lg font-semibold rounded-md shadow-md py-3 hover:bg-primaria-escuro transition duration-300">
                        Realizar Orçamento com esta Loja
                    </button>
                </Link>
            </div>

            {/* Seção de Vídeos com a correção */}
            {empresa.videos && empresa.videos.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4 text-white">Vídeos da Loja</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {empresa.videos.map(video => {
                            const embedUrl = getEmbedUrl(video.url_video);
                            if (!embedUrl) return null;
                            return (
                                <div key={video.id} className="bg-fundo-secundario rounded-lg shadow-md overflow-hidden">
                                    {/* --- INÍCIO DA CORREÇÃO --- */}
                                    {/* Este 'div' cria um contentor que mantém a proporção 16:9 */}
                                    <div className="relative" style={{ paddingTop: '56.25%' }}> 
                                        <iframe 
                                            src={embedUrl} 
                                            title={video.titulo} 
                                            frameBorder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowFullScreen 
                                            className="absolute top-0 left-0 w-full h-full" // O iframe preenche o contentor
                                        ></iframe>
                                    </div>
                                    {/* --- FIM DA CORREÇÃO --- */}
                                    <h3 className="text-lg font-semibold text-white p-4">{video.titulo}</h3>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Seção de Serviços */}
            <h2 className="text-2xl font-bold mb-4 text-white">Serviços Disponíveis</h2>
            <div className="space-y-4">
                {servicos.map(servico => (
                    <div key={servico.id} className="bg-fundo-secundario p-6 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center shadow-md">
                        <div>
                            <h3 className="text-xl font-bold text-primaria-claro">{servico.nome}</h3>
                            <p className="text-gray-400 mt-1">{servico.descricao}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                                <span>Duração: {servico.duracao_minutos} min</span>
                                <span className="font-bold">Preço: {Number(servico.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Seção de Avaliações */}
            <section className="mt-12"><h2 className="text-2xl font-bold mb-4 text-white">O que os Clientes Dizem</h2><div className="space-y-4">{avaliacoes.length > 0 ? avaliacoes.map(review => (<div key={review.id} className="bg-fundo-secundario p-5 rounded-lg border border-gray-700"><div className="flex justify-between items-center mb-2"><p className="font-bold text-white">{review.usuario_nome}</p><StarRating rating={review.nota} size="text-lg" /></div>{review.comentario && <p className="text-gray-300 italic">"{review.comentario}"</p>}<p className="text-right text-xs text-gray-500 mt-3">{new Date(review.criado_em).toLocaleDateString('pt-BR')}</p></div>)) : <div className="bg-fundo-secundario rounded-lg p-8 text-center"><p className="text-gray-500">Esta empresa ainda não possui avaliações.</p></div>}</div></section>
        </div>
    );
}