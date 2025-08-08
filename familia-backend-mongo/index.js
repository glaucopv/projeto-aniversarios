require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' })); // para aceitar fotos base64 grandes

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB conectado!'))
.catch(err => console.error('Erro MongoDB:', err));

const membroSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  data: { type: String, required: true },
  foto: { type: String, required: true },
  preferencias: { type: String },
  presentes: { type: [String] }
});

const Membro = mongoose.model('Membro', membroSchema);

// Rotas CRUD

app.get('/membros', async (req, res) => {
  try {
    const membros = await Membro.find();
    res.json(membros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/membros', async (req, res) => {
  try {
    const novoMembro = new Membro(req.body);
    await novoMembro.save();
    res.status(201).json(novoMembro);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/membros/:id', async (req, res) => {
  try {
    const membroAtualizado = await Membro.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!membroAtualizado) return res.status(404).json({ error: "Membro não encontrado" });
    res.json(membroAtualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/membros/:id', async (req, res) => {
  try {
    const membroRemovido = await Membro.findByIdAndDelete(req.params.id);
    if (!membroRemovido) return res.status(404).json({ error: "Membro não encontrado" });
    res.json({ message: "Membro removido com sucesso" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
