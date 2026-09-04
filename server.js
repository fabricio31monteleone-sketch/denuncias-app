require('dotenv').config();
const express = require('express');
const { Resend } = require('resend');
const path = require('path');
const fs = require('fs');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// RUTA PRINCIPAL: Sirve index.html, índice.html o busca cualquier HTML en la carpeta
app.get('/', (req, res) => {
  const posiblesArchivos = ['index.html', 'índice.html', 'indice.html'];
  
  for (let archivo of posiblesArchivos) {
    const rutaAbsoluta = path.join(__dirname, archivo);
    if (fs.existsSync(rutaAbsoluta)) {
      return res.sendFile(rutaAbsoluta);
    }
  }

  // Si no encuentra ningún archivo físico, sirve el HTML directamente
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App de Denuncias - Avellaneda</title>
  <style>
    :root { --primary: #0056b3; --secondary: #f4f6f9; --dark: #1a252f; --light: #ffffff; --danger: #d9534f; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: var(--secondary); margin: 0; padding: 20px; color: var(--dark); }
    .container { max-width: 600px; margin: 0 auto; background: var(--light); padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    h1 { font-size: 1.5rem; color: var(--primary); text-align: center; margin-bottom: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: 600; }
    select, textarea, input[type="text"] { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; font-size: 0.95rem; }
    textarea { resize: vertical; min-height: 90px; }
    .btn-submit { width: 100%; background: #28a745; color: white; border: none; padding: 12px; font-size: 1rem; font-weight: bold; border-radius: 6px; cursor: pointer; margin-top: 10px; }
    .btn-submit:hover { background: #218838; }
  </style>
</head>
<body>
<div class="container">
  <h1>Denuncias Vecinales - Avellaneda</h1>
  <form id="formMunicipal">
    <div class="form-group">
      <label for="tipo">Tipo de Reclamo</label>
      <select id="tipo" required>
        <option value="">Seleccione una opción...</option>
        <option value="Baches / Cuidado de Calles">Baches / Cuidado de Calles</option>
        <option value="Luminaria Apagada / Rota">Luminaria Apagada / Rota</option>
        <option value="Basura / Limpieza Urbana">Basura / Limpieza Urbana</option>
        <option value="Tránsito / Vehículos Abandonados">Tránsito / Vehículos Abandonados</option>
        <option value="Otros Reclamos">Otros Reclamos</option>
      </select>
    </div>
    <div class="form-group">
      <label for="detalle">Detalle de la situación</label>
      <textarea id="detalle" placeholder="Escriba aquí los detalles..." required></textarea>
    </div>
    <div class="form-group">
      <label for="ubicacion">Ubicación GPS / Dirección</label>
      <input type="text" id="ubicacion" value="Avellaneda, Buenos Aires">
    </div>
    <button type="button" class="btn-submit" id="btnEnviar" onclick="enviarDenuncia()">Enviar Reclamo de Prueba</button>
  </form>
</div>
<script>
  async function enviarDenuncia() {
    const tipo = document.getElementById('tipo').value;
    const detalle = document.getElementById('detalle').value;
    const ubicacion = document.getElementById('ubicacion').value;
    const btnEnviar = document.getElementById('btnEnviar');

    if (!tipo || !detalle) { alert('Por favor complete todos los campos.'); return; }

    btnEnviar.innerText = 'Enviando...';
    btnEnviar.disabled = true;

    try {
      const res = await fetch('/api/denuncia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, detalle, ubicacion })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Reclamo enviado con éxito con copia oculta!');
      } else {
        alert('Error al enviar: ' + data.message);
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    } finally {
      btnEnviar.innerText = 'Enviar Reclamo de Prueba';
      btnEnviar.disabled = false;
    }
  }
</script>
</body>
</html>
  `);
});

// API para procesar el envío del correo
app.post('/api/denuncia', async (req, res) => {
  try {
    const { tipo, detalle, ubicacion, adjuntos, bcc } = req.body;

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
      bcc: bcc || defaultBcc,
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
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
