require('dotenv').config();
const express = require('express');
const { Resend } = require('resend');
const path = require('path');

const app = express();
// Lee la clave de forma segura desde las variables de Render / Vercel
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// RUTA RAÍZ: Muestra el archivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/denuncia', async (req, res) => {
  try {
    const { tipo, detalle, ubicacion, adjuntos, bcc } = req.body;

    // Lista de correos para copia oculta (BCC)
    const defaultBcc = [
      'sehacienda@mda.gob.ar',
      'secsalud@mda.gob.ar',
      'produccioncya@mda.gob.ar',
      'seleccionydesarrollo@mda.gob.ar',
      'legalytecnica@mda.gob.ar',
      'lalevenet@gmail.com'
    ];

    const resendAttachments = (adjuntos || []).map(item => {
      const parts = item.path.split(',');
      return {
        filename: item.filename,
        content: parts.length > 1 ? parts[1] : parts[0]
      };
    });

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [process.env.EMAIL_TO || 'fabricio31monteleone@gmail.com'],
      bcc: bcc || defaultBcc, // Copias ocultas integradas
      subject: `[Reclamo Vecinal] Nuevo reporte: ${tipo || 'General'}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0056b3;">Nuevo Reclamo Registrado - Partido de Avellaneda</h2>
          <p><strong>Tipo de Reclamo:</strong> ${tipo || 'No especificado'}</p>
          <p><strong>Detalle:</strong> ${detalle || 'Sin detalle'}</p>
          <p><strong>Ubicación GPS / Dirección:</strong> ${ubicacion || 'No proporcionada'}</p>
          <hr style="border: 1px solid #ccc;">
          <p style="font-size: 0.85em; color: #777;"><em>Mensaje generado automáticamente por la App de Denuncias Vecinales.</em></p>
        </div>
      `,
      attachments: resendAttachments
    });

    console.log('📧 Correo enviado con éxito mediante Resend:', data);
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
