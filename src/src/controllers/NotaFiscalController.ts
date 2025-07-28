import { Request, Response, RequestHandler, NextFunction } from 'express';
import axios from 'axios';
import { db } from '../database';

// Esta é uma função "wrapper" que lida com erros em rotas assíncronas.
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export class NotaFiscalController {

    // --- MÉTODO EM FALTA ADICIONADO AQUI ---
    public listarNotas: RequestHandler = asyncHandler(async (req, res, next) => {
        const empresaId = req.empresa?.id;

        const sql = `
            SELECT 
                nf.id,
                nf.agendamento_id,
                nf.status,
                nf.numero_nota,
                nf.chave_acesso,
                nf.caminho_pdf,
                nf.caminho_xml,
                nf.mensagem_erro,
                nf.criado_em,
                u.nome as cliente_nome
            FROM notas_fiscais nf
            JOIN agendamentos a ON nf.agendamento_id = a.id
            JOIN usuarios u ON a.usuario_id = u.id
            WHERE nf.empresa_id = ?
            ORDER BY nf.criado_em DESC;
        `;

        const [notas] = await db.query(sql, [empresaId]);
        res.status(200).json(notas);
    });

    public emitirNotaServico: RequestHandler = asyncHandler(async (req, res, next) => {
        const { agendamentoId } = req.body;
        const empresaId = req.empresa?.id;

        const [agendamentoRows] = await db.query('SELECT * FROM agendamentos WHERE id = ? AND empresa_id = ?', [agendamentoId, empresaId]);
        const agendamento = (agendamentoRows as any)[0];
        if (!agendamento) {
            return res.status(404).json({ error: "Agendamento não encontrado para esta empresa." });
        }

        const [empresaRows] = await db.query('SELECT * FROM empresas WHERE id = ?', [empresaId]);
        const empresa = (empresaRows as any)[0];
        if (!empresa) {
            return res.status(404).json({ error: "Dados da empresa não encontrados." });
        }
        
        const [usuarioRows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [agendamento.usuario_id]);
        const cliente = (usuarioRows as any)[0];
        if (!cliente) {
            return res.status(404).json({ error: "Cliente associado ao agendamento não foi encontrado." });
        }

        const servicosSql = `SELECT s.nome, s.preco FROM servicos s JOIN agendamento_servicos ags ON s.id = ags.servico_id WHERE ags.agendamento_id = ?`;
        const [servicos] = await db.query(servicosSql, [agendamentoId]);
        if ((servicos as any[]).length === 0) {
            return res.status(404).json({ error: "Nenhum serviço encontrado para este agendamento." });
        }

        const notaFiscalData = {
            cityServiceCode: '01333',
            description: (servicos as any[]).map(s => s.nome).join(' - '),
            servicesAmount: (servicos as any[]).reduce((acc, s) => acc + parseFloat(s.preco), 0),
            borrower: {
                federalTaxNumber: cliente.cpf_cnpj.replace(/\D/g, ''),
                name: cliente.nome,
                email: cliente.email,
                address: {
                    country: "BRA",
                    postalCode: cliente.cep.replace(/\D/g, ''),
                    street: cliente.endereco_rua,
                    number: cliente.endereco_numero,
                    district: cliente.endereco_bairro,
                    city: {
                        code: "3550308",
                        name: cliente.endereco_cidade
                    },
                    state: cliente.endereco_estado
                }
            }
        };
        
        const [insertResult] = await db.query('INSERT INTO notas_fiscais SET ?', [{
            agendamento_id: agendamentoId,
            empresa_id: empresaId,
            tipo: 'NFS-e',
            ambiente: 'Homologacao',
            status: 'Processando'
        }]);
        const notaFiscalIdInterno = (insertResult as any).insertId;

        try {
            const nfeioApiKey = process.env.NFEIO_API_KEY; 
            const nfeioEmpresaId = process.env.NFEIO_COMPANY_ID;

            const response = await axios.post(
                `https://api.nfe.io/v1/companies/${nfeioEmpresaId}/serviceinvoices`,
                notaFiscalData,
                { headers: { 'Authorization': nfeioApiKey, 'Content-Type': 'application/json' } }
            );

            await db.query('UPDATE notas_fiscais SET ? WHERE id = ?', [{
                status: response.data.status,
                nfe_id_externo: response.data.id,
                chave_acesso: response.data.checkCode,
                numero_nota: response.data.number,
                caminho_pdf: response.data.flowPdfUrl,
                caminho_xml: response.data.flowXmlUrl
            }, notaFiscalIdInterno]);

            res.status(200).json(response.data);

        } catch (error: any) {
            console.error("ERRO DETALHADO DA API NFE.io:", error.response?.data || error.message);
            const errorMessage = error.response?.data?.error?.message || 
                                 error.response?.data?.message ||
                                 'Erro desconhecido na API. Verifique o console do backend para mais detalhes.';
            
            await db.query('UPDATE notas_fiscais SET status = ?, mensagem_erro = ? WHERE id = ?', 
                ['Erro', JSON.stringify(error.response?.data || errorMessage), notaFiscalIdInterno]);

            res.status(500).json({ 
                error: 'Erro ao comunicar com a API de notas fiscais.', 
                details: error.response?.data || { message: errorMessage }
            });
        }
    });

    public emitirNotaProduto: RequestHandler = asyncHandler(async (req, res, next) => {
        const { agendamentoId } = req.body;
        const empresaId = req.empresa?.id;

        const [agendamentoRows] = await db.query('SELECT * FROM agendamentos WHERE id = ? AND empresa_id = ?', [agendamentoId, empresaId]);
        const agendamento = (agendamentoRows as any)[0];
        if (!agendamento) {
            return res.status(404).json({ error: "Agendamento não encontrado para esta empresa." });
        }

        const [empresaRows] = await db.query('SELECT * FROM empresas WHERE id = ?', [empresaId]);
        const empresa = (empresaRows as any)[0];
        if (!empresa) {
            return res.status(404).json({ error: "Dados da empresa não encontrados." });
        }
        
        const [usuarioRows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [agendamento.usuario_id]);
        const cliente = (usuarioRows as any)[0];
        if (!cliente) {
            return res.status(404).json({ error: "Cliente associado ao agendamento não foi encontrado." });
        }

        const produtosSql = `
            SELECT p.id, p.nome, p.ncm, ap.quantidade, ap.preco_unitario 
            FROM produtos p 
            JOIN agendamento_produtos ap ON p.id = ap.produto_id 
            WHERE ap.agendamento_id = ?
        `;
        const [produtos] = await db.query(produtosSql, [agendamentoId]);
        if ((produtos as any[]).length === 0) {
            return res.status(404).json({ error: "Nenhum produto encontrado para este agendamento." });
        }

        const notaFiscalData = {
            environment: 2, 
            customer: {
                federalTaxNumber: cliente.cpf_cnpj.replace(/\D/g, ''),
                name: cliente.nome,
                email: cliente.email,
                address: {
                    postalCode: cliente.cep.replace(/\D/g, ''),
                    street: cliente.endereco_rua,
                    number: cliente.endereco_numero,
                    district: cliente.endereco_bairro,
                    city: { name: cliente.endereco_cidade },
                    state: cliente.endereco_estado
                }
            },
            items: (produtos as any[]).map(p => ({
                code: p.id,
                description: p.nome,
                ncm: p.ncm.replace('.', ''),
                quantity: p.quantidade,
                unitAmount: parseFloat(p.preco_unitario),
                cfop: 5102 
            }))
        };
        
        const [insertResult] = await db.query('INSERT INTO notas_fiscais SET ?', [{
            agendamento_id: agendamentoId,
            empresa_id: empresaId,
            tipo: 'NFC-e',
            ambiente: 'Homologacao',
            status: 'Processando'
        }]);
        const notaFiscalIdInterno = (insertResult as any).insertId;

        try {
            const nfeioApiKey = process.env.NFEIO_API_KEY; 
            const nfeioEmpresaId = process.env.NFEIO_COMPANY_ID;

            const response = await axios.post(
                `https://api.nfe.io/v2/companies/${nfeioEmpresaId}/productinvoices`,
                notaFiscalData,
                { headers: { 'Authorization': nfeioApiKey, 'Content-Type': 'application/json' } }
            );

            await db.query('UPDATE notas_fiscais SET ? WHERE id = ?', [{
                status: response.data.status,
                nfe_id_externo: response.data.id,
                chave_acesso: response.data.accessKey,
                numero_nota: response.data.number,
                caminho_pdf: response.data.pdf,
                caminho_xml: response.data.xml
            }, notaFiscalIdInterno]);

            res.status(200).json(response.data);

        } catch (error: any) {
            console.error("ERRO DETALHADO DA API NFE.io:", error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || 'Erro desconhecido na API. Verifique o console do backend.';
            await db.query('UPDATE notas_fiscais SET status = ?, mensagem_erro = ? WHERE id = ?', 
                ['Erro', JSON.stringify(error.response?.data || errorMessage), notaFiscalIdInterno]);

            res.status(500).json({ 
                error: 'Erro ao emitir a nota fiscal de produto.', 
                details: error.response?.data || { message: errorMessage }
            });
        }
    });
}