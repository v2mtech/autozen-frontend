import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Button } from '../../components/Button';
import { useCart } from '../../contexts/CartContext';


// --- INTERFACES ---
interface Video { id: string; titulo: string; url_video: string; }
interface Empresa { uid: string; nome_fantasia: string; endereco_cidade: string; endereco_estado: string; videos?: Video[]; }
interface Servico { id: string; nome: string; descricao: string; duracao_minutos: number; preco: number; empresa_id: string; }
interface PromocaoAtiva { id: string; descricao: string; }
interface Avaliacao { id: string; nota: number; comentario: string; criado_em: any; usuario_nome: string; }

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

    useEffect(() => {
        async function fetchPageData() {
            if (!empresaId) return;
            setIsPageLoading(true);
            setPageError('');
            try {
                // Busca o documento da empresa
                const empresaDocRef = doc(db, 'empresas', empresaId);
                const empresaSnap = await getDoc(empresaDocRef);
                if (!empresaSnap.exists()) throw new Error("Empresa não encontrada.");
                setEmpresa({ uid: empresaSnap.id, ...empresaSnap.data() } as Empresa);

                // Busca os serviços da empresa
                const servicosQuery = query(collection(db, 'servicos'), where('empresa_id', '==', empresaId));
                const servicosSnap = await getDocs(servicosQuery);
                const servicosList = servicosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Servico));
                setServicos(servicosList);

                // Busca as avaliações da empresa
                const avaliacoesQuery = query(collection(db, 'avaliacoes'), where('empresa_id', '==', empresaId));
                const avlsSnap = await getDocs(avaliacoesQuery);
                const avlsList = avlsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Avaliacao));
                setAvaliacoes(avlsList);

                // A lógica de promoções e vídeos seguiria o mesmo padrão de busca em coleções
                // Por simplicidade, vamos mantê-las como arrays vazios por agora.
                setPromocoesAtivas([]);
                // A busca de vídeos seria numa subcoleção da empresa

            } catch (err) {
                console.error("Falha ao carregar dados da página do Firestore:", err);
                setPageError('Não foi possível carregar os detalhes da empresa. Tente novamente mais tarde.');
            } finally {
                setIsPageLoading(false);
            }
        }
        fetchPageData();
    }, [empresaId]);

    const notaMedia = avaliacoes.length > 0 ? avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length : 0;

    // O resto do componente (JSX) permanece o mesmo, pois ele já lê dos estados que acabámos de preencher.
    if (isPageLoading) return <p className="text-texto-secundario text-center p-10">A carregar detalhes da loja...</p>;
    if (pageError) return <p className="text-erro text-center p-10">{pageError}</p>;
    if (!empresa) return <p className="text-texto-secundario text-center p-10">Empresa não encontrada.</p>;

    return (
        <div>
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
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-texto-principal">Serviços Disponíveis</h2>
                        <div className="space-y-4">
                            {servicos.map(servico => (
                                <div key={servico.id} className="bg-fundo-secundario p-6 rounded-lg border border-borda">
                                    <div>
                                        <h3 className="text-xl font-bold text-texto-principal">{servico.nome}</h3>
                                        <p className="text-texto-secundario mt-1 text-sm">{servico.descricao}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
                <div className="space-y-6">
                    <div className="bg-fundo-secundario p-6 rounded-lg shadow-sm border border-borda sticky top-6">
                        <h3 className="text-lg font-bold text-texto-principal mb-4">Interessado nos nossos serviços?</h3>
                        <p className="text-texto-secundario text-sm mb-4">Para obter valores e agendar, por favor, solicite um orçamento personalizado. É rápido e sem compromisso!</p>
                        <Link to="/solicitar-orcamento" state={{ empresaId: empresa.uid, empresaNome: empresa.nome_fantasia }}>
                            <Button variant="primary" className="w-full">Solicitar Orçamento</Button>
                        </Link>
                    </div>
                    {avaliacoes.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold text-texto-principal mb-4">Últimas Avaliações</h3>
                            <div className="space-y-4">
                                {avaliacoes.slice(0, 3).map(review => (
                                    <div key={review.id} className="bg-fundo-secundario p-4 rounded-lg border border-borda">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-texto-principal">{review.usuario_nome}</p>
                                            <StarRating rating={review.nota} size="text-lg" />
                                        </div>
                                        {review.comentario && <p className="text-texto-secundario italic text-sm mt-2">"{review.comentario}"</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}