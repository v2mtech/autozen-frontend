import { Request, Response, RequestHandler } from 'express';
import axios from 'axios';

export class CnpjController {
  public consultar: RequestHandler = async (req, res) => {
    const { cnpj } = req.params;
    const cleanCnpj = cnpj.replace(/\D/g, ''); // Remove caracteres não numéricos

    if (cleanCnpj.length !== 14) {
      res.status(400).json({ error: 'CNPJ inválido.' });
      return;
    }

    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      
      if (response.data) {
        res.json(response.data);
      } else {
        res.status(404).json({ error: 'CNPJ não encontrado.' });
      }

    } catch (error: any) {
      console.error("Erro ao consultar CNPJ:", error.response?.data || error.message);
      if (error.response?.status === 404) {
        res.status(404).json({ error: 'CNPJ não encontrado na base de dados da Receita Federal.' });
      } else {
        res.status(500).json({ error: 'Erro interno ao consultar o serviço de CNPJ.' });
      }
    }
  }
}