import { Request, Response, RequestHandler } from 'express';
import axios from 'axios';

const FIPE_API_BASE_URL = 'https://parallelum.com.br/fipe/api/v1';

export class VeiculoController {
  
  // Rota para buscar todas as marcas de carros
  public getMarcas: RequestHandler = async (req, res) => {
    try {
      const response = await axios.get(`${FIPE_API_BASE_URL}/carros/marcas`);
      res.json(response.data);
    } catch (error) {
      console.error("Erro ao buscar marcas:", error);
      res.status(500).json({ error: 'Falha ao buscar marcas de veículos.' });
    }
  }

  // Rota para buscar os modelos de uma marca específica
  public getModelos: RequestHandler = async (req, res) => {
    const { marcaId } = req.params;
    try {
      const response = await axios.get(`${FIPE_API_BASE_URL}/carros/marcas/${marcaId}/modelos`);
      res.json(response.data.modelos); // A API retorna um objeto { modelos: [...] }
    } catch (error) {
      console.error("Erro ao buscar modelos:", error);
      res.status(500).json({ error: 'Falha ao buscar modelos do veículo.' });
    }
  }

  // Rota para buscar os anos de um modelo específico
  public getAnos: RequestHandler = async (req, res) => {
    const { marcaId, modeloId } = req.params;
    try {
      const response = await axios.get(`${FIPE_API_BASE_URL}/carros/marcas/${marcaId}/modelos/${modeloId}/anos`);
      res.json(response.data);
    } catch (error) {
      console.error("Erro ao buscar anos:", error);
      res.status(500).json({ error: 'Falha ao buscar anos do modelo.' });
    }
  }
}