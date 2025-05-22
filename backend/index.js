require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const API_KEY = process.env.GOOGLE_API_KEY;
const PLACE_ID = process.env.PLACE_ID;

if (!API_KEY || !PLACE_ID) {
  console.error('Erro: Variáveis de ambiente não definidas no .env');
  process.exit(1);
}


async function getAllReviews() {
  let allReviews = [];
  let nextPageToken = null;

  do {
    const params = new URLSearchParams({
      place_id: PLACE_ID,
      fields: 'name,rating,reviews',
      reviews_sort: 'recent',
      key: API_KEY
    });

    if (nextPageToken) {
      params.append('pagetoken', nextPageToken);
    }

    const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;

    try {
      const response = await axios.get(endpoint);

      const result = response.data.result;
      const reviews = result?.reviews || [];
      allReviews = allReviews.concat(reviews);

      nextPageToken = response.data.next_page_token;

      if (nextPageToken) {
        console.log('Aguardando 2 segundos para próxima página de reviews...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (err) {
      console.error('Erro ao buscar avaliações:', err.response?.data || err.message);
      throw new Error('Erro ao buscar avaliações');
    }

  } while (nextPageToken);

  return allReviews;
}


app.get('/reviews', async (req, res) => {
  try {
    const reviews = await getAllReviews();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
