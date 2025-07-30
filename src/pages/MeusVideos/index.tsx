import React, { useState, useEffect } from 'react';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface Video {
    id: string;
    titulo: string;
    url_video: string;
}

export default function MeusVideosPage() {
    const { user } = useAuth();
    const [novoTitulo, setNovoTitulo] = useState('');
    const [novaUrlVideo, setNovaUrlVideo] = useState('');
    const [videos, setVideos] = useState<Video[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

    const fetchVideos = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const videosRef = collection(db, 'empresa_videos');
            const q = query(videosRef, where("empresa_id", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const videosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
            setVideos(videosList);
        } catch (error) {
            console.error("Erro ao buscar vídeos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [user]);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setMessage('');
        try {
            await addDoc(collection(db, 'empresa_videos'), {
                empresa_id: user.uid,
                titulo: novoTitulo,
                url_video: novaUrlVideo
            });
            setMessage('Vídeo cadastrado com sucesso!');
            setNovoTitulo('');
            setNovaUrlVideo('');
            fetchVideos();
        } catch (error) {
            setMessage('Erro ao cadastrar o vídeo.');
        }
    };

    const handleOpenEditModal = (video: Video) => {
        setCurrentVideo(video);
        setIsModalOpen(true);
    };

    const handleUpdateSubmit = async () => {
        if (!currentVideo) return;
        try {
            const videoRef = doc(db, 'empresa_videos', currentVideo.id);
            await updateDoc(videoRef, {
                titulo: currentVideo.titulo,
                url_video: currentVideo.url_video
            });
            setIsModalOpen(false);
            fetchVideos();
        } catch (error) {
            alert('Não foi possível atualizar o vídeo.');
        }
    };

    const handleDelete = async (videoId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este vídeo?')) {
            try {
                await deleteDoc(doc(db, 'empresa_videos', videoId));
                fetchVideos();
            } catch (error) {
                alert('Não foi possível excluir o vídeo.');
            }
        }
    };

    return (
        <div>
            <h1 className="text-4xl font-bold text-texto-principal mb-6">Gerenciar Vídeos</h1>
            <p className="text-texto-secundario mb-8">Adicione vídeos do YouTube para serem exibidos na página da sua loja.</p>

            <form onSubmit={handleAddSubmit} className="bg-fundo-secundario p-8 rounded-lg shadow-sm border border-borda max-w-2xl mx-auto mb-10">
                <div className="space-y-4">
                    <Input label="Título do Novo Vídeo" value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} required placeholder="Ex: Demonstração do Serviço X" />
                    <Input label="URL do Vídeo no YouTube" value={novaUrlVideo} onChange={e => setNovaUrlVideo(e.target.value)} required placeholder="Cole o link completo do YouTube aqui" />
                </div>
                {message && <p className="text-center mt-4 text-green-500">{message}</p>}
                <div className="mt-6">
                    <Button type="submit">Adicionar Vídeo</Button>
                </div>
            </form>

            <h2 className="text-2xl font-bold mt-10 mb-4 text-texto-principal">Vídeos Cadastrados</h2>
            {loading ? <p>Carregando...</p> : (
                <div className="space-y-3">
                    {videos.length > 0 ? videos.map(video => (
                        <div key={video.id} className="bg-fundo-secundario p-4 rounded-lg flex justify-between items-center border border-borda">
                            <div>
                                <p className="text-texto-principal font-semibold">{video.titulo}</p>
                                <a href={video.url_video} target="_blank" rel="noopener noreferrer" className="text-xs text-texto-secundario hover:underline">
                                    {video.url_video}
                                </a>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => handleOpenEditModal(video)} className="font-semibold text-primaria-padrao hover:text-primaria-escuro">Editar</button>
                                <button onClick={() => handleDelete(video.id)} className="font-semibold text-erro hover:opacity-75">Excluir</button>
                            </div>
                        </div>
                    )) : <p className="text-texto-secundario">Nenhum vídeo cadastrado.</p>}
                </div>
            )}

            {currentVideo && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Vídeo">
                    <div className="space-y-4">
                        <Input
                            label="Título do Vídeo"
                            value={currentVideo.titulo}
                            onChange={e => setCurrentVideo({ ...currentVideo, titulo: e.target.value })}
                        />
                        <Input
                            label="URL do Vídeo"
                            value={currentVideo.url_video}
                            onChange={e => setCurrentVideo({ ...currentVideo, url_video: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                        <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                        <Button onClick={handleUpdateSubmit} variant="primary">Salvar Alterações</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}