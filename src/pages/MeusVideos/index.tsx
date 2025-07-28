import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

// Interface para representar um v�deo que vem do backend
interface Video {
    id: number;
    titulo: string;
    url_video: string;
}

export default function MeusVideosPage() {
    // States para o formul�rio de NOVO v�deo
    const [novoTitulo, setNovoTitulo] = useState('');
    const [novaUrlVideo, setNovaUrlVideo] = useState('');

    // States gerais da p�gina
    const [videos, setVideos] = useState<Video[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // States para o MODAL DE EDI��O
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

    // Fun��o para buscar os v�deos j� cadastrados
    const fetchVideos = async () => {
        setLoading(true);
        try {
            const response = await api.get('/empresas/profile');
            if (response.data && response.data.id) {
                const videosResponse = await api.get(`/empresas/${response.data.id}`);
                setVideos(videosResponse.data.videos || []);
            }
        } catch (error) {
            console.error("Erro ao buscar v�deos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    // Fun��o para ADICIONAR um novo v�deo
    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            await api.post('/empresas/videos', { titulo: novoTitulo, url_video: novaUrlVideo });
            setMessage('V�deo cadastrado com sucesso!');
            setNovoTitulo('');
            setNovaUrlVideo('');
            fetchVideos();
        } catch (error) {
            setMessage('Erro ao cadastrar o v�deo.');
        }
    };

    // Fun��es para EDITAR um v�deo
    const handleOpenEditModal = (video: Video) => {
        setCurrentVideo(video);
        setIsModalOpen(true);
    };

    const handleUpdateSubmit = async () => {
        if (!currentVideo) return;
        try {
            await api.put(`/empresas/videos/${currentVideo.id}`, {
                titulo: currentVideo.titulo,
                url_video: currentVideo.url_video
            });
            setIsModalOpen(false);
            fetchVideos(); // Atualiza a lista
        } catch (error) {
            alert('N�o foi poss�vel atualizar o v�deo.');
        }
    };

    // Fun��o para EXCLUIR um v�deo
    const handleDelete = async (videoId: number) => {
        if (window.confirm('Tem certeza que deseja excluir este v�deo?')) {
            try {
                await api.delete(`/empresas/videos/${videoId}`);
                fetchVideos(); // Atualiza a lista
            } catch (error) {
                alert('N�o foi poss�vel excluir o v�deo.');
            }
        }
    };

    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Gerenciar V�deos</h1>
            <p className="text-gray-400 mb-8">Adicione v�deos do YouTube para serem exibidos na p�gina da sua loja.</p>

            {/* Formul�rio para Adicionar novo v�deo */}
            <form onSubmit={handleAddSubmit} className="bg-fundo-secundario p-8 rounded-lg max-w-2xl mx-auto mb-10">
                <div className="space-y-4">
                    <Input label="T�tulo do Novo V�deo" value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} required placeholder="Ex: Demonstra��o do Servi�o X" />
                    <Input label="URL do V�deo no YouTube" value={novaUrlVideo} onChange={e => setNovaUrlVideo(e.target.value)} required placeholder="Cole o link completo do YouTube aqui" />
                </div>
                {message && <p className="text-center mt-4 text-green-400">{message}</p>}
                <div className="mt-6">
                    <Button type="submit">Adicionar V�deo</Button>
                </div>
            </form>

            {/* Lista de V�deos Cadastrados */}
            <h2 className="text-2xl font-bold mt-10 mb-4">V�deos Cadastrados</h2>
            {loading ? <p>Carregando...</p> : (
                <div className="space-y-3">
                    {videos.length > 0 ? videos.map(video => (
                        <div key={video.id} className="bg-fundo-secundario p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-white font-semibold">{video.titulo}</p>
                                <a href={video.url_video} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:underline">
                                    {video.url_video}
                                </a>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => handleOpenEditModal(video)} className="font-semibold text-yellow-400 hover:text-yellow-300">Editar</button>
                                <button onClick={() => handleDelete(video.id)} className="font-semibold text-red-500 hover:text-red-400">Excluir</button>
                            </div>
                        </div>
                    )) : <p className="text-gray-500">Nenhum v�deo cadastrado.</p>}
                </div>
            )}

            {/* Modal de Edi��o */}
            {currentVideo && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar V�deo">
                    <div className="space-y-4">
                        <Input
                            label="T�tulo do V�deo"
                            value={currentVideo.titulo}
                            onChange={e => setCurrentVideo({ ...currentVideo, titulo: e.target.value })}
                        />
                        <Input
                            label="URL do V�deo"
                            value={currentVideo.url_video}
                            onChange={e => setCurrentVideo({ ...currentVideo, url_video: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-6">
                        <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                        <Button onClick={handleUpdateSubmit} variant="primary">Salvar Altera��es</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}