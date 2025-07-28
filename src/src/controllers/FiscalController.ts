import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';
import axios from 'axios';

export class FiscalController {

    // --- Métodos para Regras Fiscais (nosso DB) ---

    public listRegras: RequestHandler = async (req, res) => {
        try {
            const [regras] = await db.query('SELECT * FROM regras_fiscais ORDER BY nome_regra ASC');
            res.json(regras);
        } catch (error) {
            console.error("Erro ao listar regras fiscais:", error);
            res.status(500).json({ error: 'Erro ao listar regras fiscais.' });
        }
    }

    public createRegra: RequestHandler = async (req, res) => {
        try {
            // --- INÍCIO DA CORREÇÃO ---
            // Garante que os campos obrigatórios tenham um valor padrão se não forem enviados.
            const regraData = {
                ...req.body,
                ncm_codigo: req.body.ncm_codigo || '',
                ncm_descricao: req.body.ncm_descricao || 'N/A'
            };
            // --- FIM DA CORREÇÃO ---

            const [result] = await db.query('INSERT INTO regras_fiscais SET ?', [regraData]);
            const insertId = (result as any).insertId;
            res.status(201).json({ id: insertId, ...regraData });
        } catch (error) {
            console.error("Erro ao criar regra fiscal:", error);
            res.status(500).json({ error: 'Erro ao criar regra fiscal.' });
        }
    }

    public updateRegra: RequestHandler = async (req, res) => {
        const { id } = req.params;
        const dataToUpdate = req.body;
        delete dataToUpdate.criado_em;

        try {
            await db.query('UPDATE regras_fiscais SET ? WHERE id = ?', [dataToUpdate, id]);
            res.status(200).json({ message: 'Regra fiscal atualizada com sucesso.' });
        } catch (error) {
            console.error("Erro ao atualizar regra fiscal:", error);
            res.status(500).json({ error: 'Erro ao atualizar regra fiscal.' });
        }
    }

    // --- Método para consultar API externa ---

    public searchNcm: RequestHandler = async (req, res) => {
        const { search } = req.query;
        if (!search || (search as string).length < 2) {
            res.status(400).json({ error: 'Forneça pelo menos 2 caracteres para a busca.' });
            return;
        }

        try {
            const response = await axios.get(`https://brasilapi.com.br/api/ncm/v1?search=${search}`);
            const data = response.data || [];
            res.json(data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                res.json([]);
                return;
            }
            console.error("Erro ao buscar NCM:", error);
            res.status(500).json({ error: 'Falha ao comunicar com o serviço de NCM.' });
        }
    }
}