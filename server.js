require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificación de conexión al arrancar el servidor
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ ERROR DE AUTENTICACIÓN CON GMAIL:', error.message);
  } else {
    console.log('✅ Conexión exitosa con Gmail. Listo para enviar correos.');
  }
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
    console.error('❌ Error detallado al enviar correo:', error);
    res.status(500).json({ success: false, message: 'Error al procesar el envío: ' + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});