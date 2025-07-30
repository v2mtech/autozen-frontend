import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { cstIcms, cstPisCofins, cstIpi, cfopCodes } from '../../data/fiscalData';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import api from '../../services/api'; // Mantido para a busca de NCM na API externa

interface RegraFiscal {
    id: string;
    nome_regra: string;
    cfop?: string;
    ncm_codigo: string;
    ncm_descricao: string;
}

interface NcmResult {
    codigo: string;
    descricao: string;
}

export default function RegrasFiscaisPage() {
    const { user } = useAuth();
    const [regras, setRegras] = useState<RegraFiscal[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRegra, setCurrentRegra] = useState<Partial<RegraFiscal>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [ncmSearch, setNcmSearch] = useState('');
    const [ncmResults, setNcmResults] = useState<NcmResult[]>([]);
    const [isNcmLoading, setIsNcmLoading] = useState(false);

    const fetchRegras = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const regrasRef = collection(db, 'regras_fiscais');
            const q = query(regrasRef, where("empresa_id", "==", user.uid));
            const snap = await getDocs(q);
            setRegras(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegraFiscal)));
        } catch (error) {
            alert('Erro ao carregar as regras fiscais.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegras();
    }, [user]);

    useEffect(() => {
        if (ncmSearch.length < 2) {
            setNcmResults([]);
            return;
        }
        setIsNcmLoading(true);
        const delayDebounce = setTimeout(() => {
            api.get(`/fiscal/ncm?search=${ncmSearch}`)
                .then(res => setNcmResults(res.data))
                .catch(err => console.error(err))
                .finally(() => setIsNcmLoading(false));
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [ncmSearch]);

    const handleSelectNcm = (ncm: NcmResult) => {
        setCurrentRegra({
            ...currentRegra,
            ncm_codigo: ncm.codigo,
            ncm_descricao: ncm.descricao
        });
        setNcmSearch('');
        setNcmResults([]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentRegra(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenModal = (regra?: RegraFiscal) => {
        if (regra) {
            setCurrentRegra(regra);
            setIsEditing(true);
        } else {
            setCurrentRegra({});
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!user) return;
        const { id, ...data } = currentRegra;
        const dataToSave = { ...data, empresa_id: user.uid };
        try {
            if (isEditing && id) {
                await updateDoc(doc(db, 'regras_fiscais', id), dataToSave);
            } else {
                await addDoc(collection(db, 'regras_fiscais'), dataToSave);
            }
            fetchRegras();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao guardar a regra fiscal.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-texto-principal">Regras Fiscais</h1>
                <Button onClick={() => handleOpenModal()} className="w-auto">Adicionar Regra</Button>
            </div>

            <div className="bg-fundo-secundario rounded-lg shadow-sm border border-borda overflow-hidden">
                <table className="w-full text-left">
                    <thead className="border-b border-borda bg-fundo-principal">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">Nome da Regra</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">CFOP</th>
                            <th className="p-4 text-sm font-semibold text-texto-secundario uppercase tracking-wider">NCM</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borda">
                        {regras.map(regra => (
                            <tr key={regra.id} onClick={() => handleOpenModal(regra)} className="cursor-pointer hover:bg-fundo-principal">
                                <td className="p-4 font-semibold text-texto-principal">{regra.nome_regra}</td>
                                <td className="p-4 text-texto-secundario">{regra.cfop || '-'}</td>
                                <td className="p-4 text-texto-secundario">{regra.ncm_codigo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Regra Fiscal' : 'Nova Regra Fiscal'} maxWidthClass="max-w-4xl">
                <div className="space-y-6">
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-borda pt-4">
                        <legend className="text-lg font-semibold px-2 text-texto-principal">Dados da Regra</legend>
                        <Input label="Nome da Regra" name="nome_regra" value={currentRegra.nome_regra || ''} onChange={handleChange} required />
                        <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">CFOP</label>
                            <select name="cfop" value={currentRegra.cfop || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="">Selecione...</option>
                                {cfopCodes.map(cfop => <option key={cfop.codigo} value={cfop.codigo}>{cfop.codigo} - {cfop.descricao}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <Input label="Pesquisar NCM (mín. 2 caracteres)" value={ncmSearch} onChange={e => setNcmSearch(e.target.value)} />
                            {isNcmLoading && <span className="text-xs absolute right-2 top-10">A procurar...</span>}
                            {ncmResults.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-borda rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                                    {ncmResults.map(ncm => (
                                        <li key={ncm.codigo} onClick={() => handleSelectNcm(ncm)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-texto-principal">
                                            <strong>{ncm.codigo}</strong> - {ncm.descricao}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <Input label="Código NCM" name="ncm_codigo" value={currentRegra.ncm_codigo || ''} readOnly disabled />
                        <Input label="Descrição NCM" name="ncm_descricao" value={currentRegra.ncm_descricao || ''} readOnly disabled className="lg:col-span-2" />
                    </fieldset>
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-borda">
                    <Button onClick={() => setIsModalOpen(false)} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSave} variant="primary">Guardar</Button>
                </div>
            </Modal>
        </div>
    );
}