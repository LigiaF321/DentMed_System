const PDFDocument = require('pdfkit');
const { Tratamiento, Paciente, Dentista } = require('../models');

async function generarPDFHistorial(res, pacienteId) {
  // Consulta los tratamientos del paciente
  const paciente = await Paciente.findByPk(pacienteId);
  if (!paciente) throw new Error('Paciente no encontrado');
  const tratamientos = await Tratamiento.findAll({
    where: { pacienteId },
    include: [
      { model: Dentista, attributes: ['nombre', 'apellidos'] },
    ],
    order: [['fecha', 'DESC']],
  });

  // Crea el PDF
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="historial_paciente_${pacienteId}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text('Historial de Tratamientos', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Paciente: ${paciente.nombre}`);
  doc.moveDown();

  tratamientos.forEach((t, i) => {
    doc.fontSize(12).text(`Tratamiento #${i + 1}`);
    doc.text(`Tipo: ${t.tipo}`);
    doc.text(`Fecha: ${t.fecha.toISOString().split('T')[0]}`);
    doc.text(`Diente: ${t.diente || '-'}`);
    doc.text(`Doctor: ${t.Dentista ? t.Dentista.nombre + ' ' + (t.Dentista.apellidos || '') : '-'}`);
    doc.text(`Costo: $${t.costo || '-'}`);
    doc.text(`Descripción: ${t.descripcion || '-'}`);
    doc.moveDown();
  });

  doc.end();
}

module.exports = generarPDFHistorial;
