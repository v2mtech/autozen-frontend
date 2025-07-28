import { Request, Response, RequestHandler } from 'express';
import axios from 'axios';

export class CepController {
  public consultar: RequestHandler = async (req, res) => {
    const { cep } = req.params;

    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      // CORREÇÃO: Removido o 'return'
      res.status(400).json({ error: 'CEP inválido.' });
      return;
    }

    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      
      if (response.data.erro) {
        // CORREÇÃO: Removido o 'return'
        res.status(404).json({ error: 'CEP não encontrado.' });
        return;
      }

      res.json(response.data);
    } catch (error) {
      console.error("Erro ao consultar CEP:", error);
      res.status(500).json({ error: 'Erro interno ao consultar o serviço de CEP.' });
    }
  }
}