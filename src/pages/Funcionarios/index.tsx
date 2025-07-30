import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth as firebaseAuth } from '../../firebaseConfig'; // Renomeado para evitar conflito

interface Funcionario {
    uid: string; // ID do Auth e do Documento
    nome: string;
    email: string;
    telefone: string;
    perfil_id: string | null;
}

export default function FuncionariosPage() {
    const { user } = useAuth();
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentFuncionario, setCurrentFuncionario] = useState<Partial<Funcionario & { senha?: string }>>({});

    const fetchData = async () => {
        if (!user) return;
        try {
            const funcionariosRef = collection(db, 'funcionarios');
            const q = query(funcionariosRef, where("empresa_id", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const funcionariosList = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Funcionario));
            setFuncionarios(funcionariosList);
        } catch (error) {
            alert('Erro ao buscar dados.');
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleOpenModal = (func?: Funcionario) => {
        if (func) {
            setIsEditing(true);
            setCurrentFuncionario(func);
        } else {
            setIsEditing(false);
            setCurrentFuncionario({});
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveFuncionario = async () => {
        if (!user) return;
        const { uid, senha, ...data } = currentFuncionario;

        if (!isEditing && (!data.email || !senha)) {
            alert("Email e senha são obrigatórios para criar um novo funcionário.");
            return;
        }

        try {
            if (isEditing && uid) {
                // Atualizar dados no Firestore (não se pode alterar email/senha aqui facilmente)
                const funcRef = doc(db, 'funcionarios', uid);
                await setDoc(funcRef, { ...data, empresa_id: user.uid }, { merge: true });
            } else if (data.email && senha) {
                // 1. Criar utilizador no Firebase Auth (necessita de um backend seguro ou de estar logado como admin)
                // Esta é uma operação sensível. A forma mais segura seria usar uma Cloud Function.
                // Por simplicidade, vamos assumir uma função admin que faria isso.
                // AVISO: A criação de utilizadores no frontend só deve ser para o próprio utilizador.
                // A abordagem correta seria chamar uma Cloud Function para criar o funcionário.

                // Simulação de chamada a uma Cloud Function
                console.log("Simulando a criação de um funcionário no Firebase Auth...");
                // const newUserCredential = await createUserWithEmailAndPassword(firebaseAuth, data.email, senha);
                // const newUser = newUserCredential.user;

                // const funcionarioData = {
                //     ...data,
                //     uid: newUser.uid,
                //     empresa_id: user.uid,
                // };
                // await setDoc(doc(db, 'funcionarios', newUser.uid), funcionarioData);
                alert("Funcionalidade de criação de funcionário requer uma Cloud Function para segurança. Simulação concluída.");

            }
            fetchData();
            handleCloseModal();
        } catch (error: any) {
            alert(`Erro ao salvar funcionário: ${error.message}`);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">Funcionários</h1>
                <Button onClick={() => handleOpenModal()} variant="primary" className="w-auto">Adicionar Funcionário</Button>
            </div>

            <div className="bg-fundo-secundario rounded-lg overflow-hidden shadow-sm border border-borda">
                <table className="w-full text-left">
                    <thead className="bg-fundo-principal border-b border-borda">
                        <tr>
                            <th className="p-4 text-sm uppercase font-semibold text-texto-secundario">Nome</th>
                            <th className="p-4 text-sm uppercase font-semibold text-texto-secundario">Email</th>
                            <th className="p-4 text-sm uppercase font-semibold text-texto-secundario">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {funcionarios.map(func => (
                            <tr key={func.uid} className="hover:bg-fundo-principal">
                                <td className="p-4 text-texto-principal">{func.nome}</td>
                                <td className="p-4 text-texto-secundario">{func.email || '-'}</td>
                                <td className="p-4"><button onClick={() => handleOpenModal(func)} className="text-primaria-padrao hover:text-primaria-escuro font-semibold">Editar</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}>
                <div className="space-y-4">
                    <Input label="Nome Completo" value={currentFuncionario.nome || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, nome: e.target.value })} required />
                    <Input label="Email" type="email" value={currentFuncionario.email || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, email: e.target.value })} required disabled={isEditing} />
                    <Input label="Telefone" value={currentFuncionario.telefone || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, telefone: e.target.value })} />
                    <Input label="Senha" type="password" value={currentFuncionario.senha || ''} onChange={e => setCurrentFuncionario({ ...currentFuncionario, senha: e.target.value })} placeholder={isEditing ? "Não pode ser alterado aqui" : "Senha de acesso"} required={!isEditing} disabled={isEditing} />
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-borda">
                    <Button onClick={handleCloseModal} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSaveFuncionario}>Salvar</Button>
                </div>
            </Modal>
        </div>
    );
}