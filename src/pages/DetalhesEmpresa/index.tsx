import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { useCart } from '../../contexts/CartContext';

// --- INTERFACES ---
interface Video { id: number; titulo: string; url_video: string; }
interface Empresa { id: number; nome_fantasia: string; endereco_cidade: string; endereco_estado: string; videos?: Video[]; }
interface Servico { id: number; nome: string; descricao: string; duracao_minutos: number; preco: number; empresa_id: number; }
interface PromocaoAtiva { id: number; descricao: string; }
interface Avaliacao { id: number; nota: number; comentario: string; criado_em: string; usuario_nome: string; }

// --- COMPONENTE AUXILIAR ---
const StarRating = ({ rating, size = 'text-xl' }: { rating: number; size?: string }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (<span key={star} className={`${size} ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>))}
    </div>
);

export default function DetalhesEmpresaPage() {
    const { id: empresaId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addServico } = useCart();

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
                setServicos(servicosRes.data.map(s => ({ ...s, empresa_id: parseInt(empresaId) })));
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

    if (isPageLoading) return <p className="text-texto-secundario text-center p-10">A carregar detalhes da loja...</p>;
    if (pageError) return <p className="text-erro text-center p-10">{pageError}</p>;
    if (!empresa) return <p className="text-texto-secundario text-center p-10">Empresa não encontrada.</p>;

    return (
        <div>
            {/* Cabeçalho da Loja */}
            <div className="bg-fundo-secundario p-8 rounded-lg shadow-sm border border-borda mb-8">
                <h1 className="text-4xl font-bold text-texto-principal">{empresa.nome_fantasia}</h1>
                <p className="text-texto-secundario mt-1">{empresa.endereco_cidade}, {empresa.endereco_estado}</p>
                <div className="mt-4 flex items-center gap-3">
                    <StarRating rating={notaMedia} />
                    <span className="text-texto-secundario text-sm font-semibold">{notaMedia.toFixed(1)}</span>
                    <span className="text-gray-400 text-sm">({avaliacoes.length} avaliações)</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Principal: Serviços e Vídeos */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Seção de Serviços */}
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-texto-principal">Serviços Disponíveis</h2>
                        <div className="space-y-4">
                            {servicos.map(servico => (
                                // ✅ INÍCIO DA CORREÇÃO: Layout do card de serviço simplificado
                                <div key={servico.id} className="bg-fundo-secundario p-6 rounded-lg border border-borda">
                                    <div>
                                        <h3 className="text-xl font-bold text-texto-principal">{servico.nome}</h3>
                                        <p className="text-texto-secundario mt-1 text-sm">{servico.descricao}</p>
                                    </div>
                                </div>
                                // ✅ FIM DA CORREÇÃO
                            ))}
                        </div>
                    </section>

                    {/* Seção de Vídeos */}
                    {empresa.videos && empresa.videos.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-texto-principal">Vídeos da Loja</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {empresa.videos.map(video => {
                                    const embedUrl = getEmbedUrl(video.url_video);
                                    if (!embedUrl) return null;
                                    return (
                                        <div key={video.id} className="bg-fundo-secundario rounded-lg shadow-sm overflow-hidden border border-borda">
                                            <div className="relative" style={{ paddingTop: '56.25%' }}>
                                                <iframe src={embedUrl} title={video.titulo} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute top-0 left-0 w-full h-full"></iframe>
                                            </div>
                                            <h3 className="text-md font-semibold text-texto-principal p-4">{video.titulo}</h3>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>

                {/* Coluna Lateral: Ações e Avaliações */}
                <div className="space-y-6">
                    {/* Card de Ações */}
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda sticky top-6">
                        <h3 className="text-lg font-bold text-texto-principal mb-4">Interessado nos nossos serviços?</h3>
                        <p className="text-texto-secundario text-sm mb-4">Para obter valores e agendar, por favor, solicite um orçamento personalizado. É rápido e sem compromisso!</p>
                        <Link to="/solicitar-orcamento" state={{ empresaId: empresa.id, empresaNome: empresa.nome_fantasia }}>
                            <Button variant="primary" className="w-full">Solicitar Orçamento</Button>
                        </Link>
                    </div>

                    {/* Card de Promoções */}
                    {promocoesAtivas.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                            <h3 className="text-lg font-bold text-yellow-900 mb-2">⭐ Promoções Ativas</h3>
                            <ul className="list-disc list-inside text-yellow-800 space-y-1">
                                {promocoesAtivas.map(p => <li key={p.id}>{p.descricao}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Avaliações Recentes */}
                    <div>
                        <h3 className="text-xl font-bold text-texto-principal mb-4">Últimas Avaliações</h3>
                        <div className="space-y-4">
                            {avaliacoes.length > 0 ? avaliacoes.slice(0, 3).map(review => (
                                <div key={review.id} className="bg-fundo-secundario p-4 rounded-lg border border-borda">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-texto-principal">{review.usuario_nome}</p>
                                        <StarRating rating={review.nota} size="text-lg" />
                                    </div>
                                    {review.comentario && <p className="text-texto-secundario italic text-sm mt-2">"{review.comentario}"</p>}
                                </div>
                            )) : (
                                <div className="bg-fundo-secundario p-6 rounded-lg border border-borda text-center">
                                    <p className="text-texto-secundario">Esta empresa ainda não possui avaliações.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}