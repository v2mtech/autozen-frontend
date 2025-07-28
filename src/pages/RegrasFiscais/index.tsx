import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { cstIcms, cstPisCofins, cstIpi, cfopCodes } from '../../data/fiscalData';

interface RegraFiscal {
    id: number;
    nome_regra: string;
    cfop?: string;
    ncm_codigo: string;
    ncm_descricao: string;
    cest?: string;
    icms_cst?: string;
    icms_aliquota?: number;
    pis_cst?: string;
    pis_aliquota?: number;
    cofins_cst?: string;
    cofins_aliquota?: number;
    ipi_cst?: string;
    ipi_aliquota?: number;
}

interface NcmResult {
    codigo: string;
    descricao: string;
}

export default function RegrasFiscaisPage() {
    const [regras, setRegras] = useState<RegraFiscal[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRegra, setCurrentRegra] = useState<Partial<RegraFiscal>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [ncmSearch, setNcmSearch] = useState('');
    const [ncmResults, setNcmResults] = useState<NcmResult[]>([]);
    const [isNcmLoading, setIsNcmLoading] = useState(false);

    const fetchRegras = async () => {
        setLoading(true);
        try {
            const response = await api.get('/regras-fiscais');
            setRegras(response.data);
        } catch (error) {
            alert('Erro ao carregar as regras fiscais.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegras();
    }, []);

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
        setCurrentRegra(prev => ({...prev, [name]: value}));
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
        const { id, ...data } = currentRegra;
        try {
            if (isEditing) {
                await api.put(`/regras-fiscais/${id}`, data);
            } else {
                await api.post('/regras-fiscais', data);
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

            <div className="bg-fundo-secundario rounded-lg shadow-md border border-borda">
                <table className="w-full text-left">
                     <thead className="border-b border-borda">
                        <tr>
                            <th className="p-4 text-texto-secundario">Nome da Regra</th>
                            <th className="p-4 text-texto-secundario">CFOP</th>
                            <th className="p-4 text-texto-secundario">NCM</th>
                            <th className="p-4 text-texto-secundario">ICMS (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {regras.map(regra => (
                            <tr key={regra.id} onClick={() => handleOpenModal(regra)} className="border-b border-borda last:border-b-0 hover:bg-gray-100 cursor-pointer">
                                <td className="p-4 font-semibold text-texto-principal">{regra.nome_regra}</td>
                                <td className="p-4 text-texto-principal">{regra.cfop || '-'}</td>
                                <td className="p-4 text-texto-principal">{regra.ncm_codigo}</td>
                                <td className="p-4 text-texto-principal">{Number(regra.icms_aliquota || 0).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Regra Fiscal' : 'Nova Regra Fiscal'} maxWidthClass="max-w-4xl">
                <div className="space-y-6">
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-4">
                        <legend className="text-lg font-semibold px-2">Dados da Regra</legend>
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
                                        <li key={ncm.codigo} onClick={() => handleSelectNcm(ncm)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                                            <strong>{ncm.codigo}</strong> - {ncm.descricao}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <Input label="Código NCM" name="ncm_codigo" value={currentRegra.ncm_codigo || ''} readOnly disabled />
                        <Input label="Descrição NCM" name="ncm_descricao" value={currentRegra.ncm_descricao || ''} readOnly disabled className="lg:col-span-2" />
                    </fieldset>
                    
                    <fieldset className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
                         <legend className="text-lg font-semibold px-2 col-span-full">Impostos</legend>
                         
                         <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">ICMS CST</label>
                            <select name="icms_cst" value={currentRegra.icms_cst || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="">Selecione...</option>
                                {cstIcms.map(cst => <option key={cst.codigo} value={cst.codigo}>{cst.codigo} - {cst.descricao}</option>)}
                            </select>
                         </div>
                         <Input label="ICMS Alíquota (%)" name="icms_aliquota" type="number" step="0.01" value={currentRegra.icms_aliquota || ''} onChange={handleChange} />
                         
                         <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">PIS CST</label>
                            <select name="pis_cst" value={currentRegra.pis_cst || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="">Selecione...</option>
                                {cstPisCofins.map(cst => <option key={cst.codigo} value={cst.codigo}>{cst.codigo} - {cst.descricao}</option>)}
                            </select>
                         </div>
                         <Input label="PIS Alíquota (%)" name="pis_aliquota" type="number" step="0.01" value={currentRegra.pis_aliquota || ''} onChange={handleChange} />
                         
                         <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">COFINS CST</label>
                            <select name="cofins_cst" value={currentRegra.cofins_cst || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="">Selecione...</option>
                                {cstPisCofins.map(cst => <option key={cst.codigo} value={cst.codigo}>{cst.codigo} - {cst.descricao}</option>)}
                            </select>
                         </div>
                         <Input label="COFINS Alíquota (%)" name="cofins_aliquota" type="number" step="0.01" value={currentRegra.cofins_aliquota || ''} onChange={handleChange} />
                         
                         <div>
                            <label className="text-sm font-semibold text-texto-secundario block mb-2">IPI CST</label>
                            <select name="ipi_cst" value={currentRegra.ipi_cst || ''} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-borda rounded-lg">
                                <option value="">Selecione...</option>
                                {cstIpi.map(cst => <option key={cst.codigo} value={cst.codigo}>{cst.codigo} - {cst.descricao}</option>)}
                            </select>
                         </div>
                         <Input label="IPI Alíquota (%)" name="ipi_aliquota" type="number" step="0.01" value={currentRegra.ipi_aliquota || ''} onChange={handleChange} />
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