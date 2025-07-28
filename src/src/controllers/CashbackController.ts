import { Request, Response, RequestHandler } from 'express';
import { db } from '../database';

export class CashbackController {

  // Empresa cria uma nova promoção
  createPromotion: RequestHandler = async (req, res) => {
    
    const empresaId = req.empresa?.id;
    const { descricao, valor_meta, percentual_cashback } = req.body;

    if (!descricao || !valor_meta || !percentual_cashback) {
      res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
      return;
    }

    try {
      const newPromotion = { empresa_id: empresaId, descricao, valor_meta, percentual_cashback, ativo: true };
      const [result] = await db.query('INSERT INTO promocoes_cashback SET ?', [newPromotion]);
      const insertId = (result as any).insertId;
      res.status(201).json({ id: insertId, ...newPromotion });
    } catch (error) {
      console.error("Erro ao criar promoção:", error);
      res.status(500).json({ error: 'Erro interno ao criar promoção.' });
    }
  }

  // Empresa lista todas as suas promoções (ativas e inativas)
  listPromotionsByEmpresa: RequestHandler = async (req, res) => {
    const empresaId = req.empresa?.id;
    try {
      const [promotions] = await db.query('SELECT * FROM promocoes_cashback WHERE empresa_id = ? ORDER BY criado_em DESC', [empresaId]);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno ao listar promoções.' });
    }
  }

  // Cliente lista as promoções ATIVAS de uma empresa específica
  listActivePromotionsForClient: RequestHandler = async (req, res) => {
    const { id: empresaId } = req.params;
    try {
      const [promotions] = await db.query('SELECT id, descricao, valor_meta, percentual_cashback FROM promocoes_cashback WHERE empresa_id = ? AND ativo = TRUE', [empresaId]);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno ao listar promoções.' });
    }
  }


  // Empresa atualiza uma promoção
  updatePromotion: RequestHandler = async (req, res) => {
    const empresaId = req.empresa?.id;
    const { id } = req.params;
    const { descricao, valor_meta, percentual_cashback } = req.body;

    try {
      const [result] = await db.query(
        'UPDATE promocoes_cashback SET descricao = ?, valor_meta = ?, percentual_cashback = ? WHERE id = ? AND empresa_id = ?',
        [descricao, valor_meta, percentual_cashback, id, empresaId]
      );
      if ((result as any).affectedRows === 0) {
        res.status(404).json({ error: 'Promoção não encontrada ou não pertence a esta empresa.' });
        return;
      }
      res.status(200).json({ message: 'Promoção atualizada com sucesso.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro interno ao atualizar promoção.' });
    }
  }

  // Empresa ativa ou desativa uma promoção
  togglePromotionStatus: RequestHandler = async (req, res) => {
    const empresaId = req.empresa?.id;
    const { id } = req.params;
    const { ativo } = req.body;

    try {
      const [result] = await db.query(
        'UPDATE promocoes_cashback SET ativo = ? WHERE id = ? AND empresa_id = ?',
        [ativo, id, empresaId]
      );
      if ((result as any).affectedRows === 0) {
        res.status(404).json({ error: 'Promoção não encontrada.' });
        return;
      }
      res.status(200).json({ message: `Promoção ${ativo ? 'ativada' : 'desativada'} com sucesso.` });
    } catch (error) {
      res.status(500).json({ error: 'Erro interno ao alterar status da promoção.' });
    }
  }

  // Cliente lista seus vouchers disponíveis
  listMyVouchers: RequestHandler = async (req, res) => {
    const usuarioId = req.usuario?.id;
    try {
        const sql = `
            SELECT v.id, v.percentual_desconto, e.nome_fantasia as empresa_nome
            FROM usuarios_vouchers_cashback v
            JOIN empresas e ON v.empresa_id = e.id
            WHERE v.usuario_id = ? AND v.status = 'disponivel'
        `;
        const [vouchers] = await db.query(sql, [usuarioId]);
        res.json(vouchers);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar seus vouchers.' });
    }
  }
}