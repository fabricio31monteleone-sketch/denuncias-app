require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Configuración directa de Gmail optimizada para Render
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 20000, // 20 segundos de espera máxima
  greetingTimeout: 20000,
  socketTimeout: 30000
});

app.post('/api/denuncia', async (req, res) => {
  try {
    const { tipo, detalle, ubicacion, adjuntos } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: `[Reclamo Vecinal] Nuevo reporte: ${tipo || 'General'}`,
      html: `
        <h2>Nuevo Reclamo Registrado - Partido de Avellaneda</h2>
        <p><strong>Tipo de Reclamo:</strong> ${tipo || 'No especificado'}</p>
        <p><strong>Detalle:</strong> ${detalle || 'Sin detalle'}</p>
        <p><strong>Ubicación GPS / Dirección:</strong> ${ubicacion || 'No proporcionada'}</p>
        <hr>
        <p><em>Mensaje generado automáticamente por la App de Denuncias Anónimas.</em></p>
      `,
      attachments: adjuntos || []
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Correo enviado con éxito.');
    res.status(200).json({ success: true, message: 'Reclamo enviado correctamente' });
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    res.status(500).json({ success: false, message: 'Error al procesar el envío: ' + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
