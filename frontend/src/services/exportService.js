/**
 * Servicio de Exportación de Datos
 * Proporciona funcionalidades para exportar datos a CSV, PDF e imprimir
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Exportar datos a CSV
 * @param {Array} data - Datos a exportar
 * @param {Array} columns - Definición de columnas [{key: 'campo', header: 'Encabezado'}, ...]
 * @param {string} filename - Nombre del archivo
 */
export const exportToCSV = (data, columns, filename = 'datos.csv') => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  try {
    // Crear array con encabezados
    const headers = columns.map(col => col.header);
    const rows = data.map(item =>
      columns.map(col => {
        let value = item[col.key];
        // Si es una función, ejecutarla
        if (typeof col.key === 'function') {
          value = col.key(item);
        }
        // Manejar valores nulos o undefined
        if (value === null || value === undefined) {
          return '';
        }
        // Escapar comillas y ajustar formato
        return `"${String(value).replace(/"/g, '""')}"`;
      })
    );

    // Combinar encabezados y datos
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Agregar BOM para UTF-8 en Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Descargar archivo
    downloadFile(blob, filename);
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    alert('Error al exportar datos');
  }
};

/**
 * Exportar datos a PDF
 * @param {Array} data - Datos a exportar
 * @param {Array} columns - Definición de columnas
 * @param {Object} options - Opciones {title, filename, ...}
 */
export const exportToPDF = (data, columns, options = {}) => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  try {
    const {
      title = 'Reporte',
      filename = 'reporte.pdf',
      orientation = 'landscape',
      pageSize = 'a4',
      subtitle = '',
      additionalInfo = {}
    } = options;

    // Crear documento PDF
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize,
      compress: true
    });

    // Color de tema
    const primaryColor = [26, 95, 63]; // #1a5f3f (verde del sistema)
    const lightColor = [245, 245, 245]; // Gris claro

    // Configurar fuentes
    doc.setFont('Helvetica');

    // Agregar encabezado
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

    let yPosition = 25;

    // Agregar subtítulo si existe
    if (subtitle) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' });
      yPosition += 8;
    }

    // Agregar información adicional
    if (Object.keys(additionalInfo).length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      Object.entries(additionalInfo).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 14, yPosition);
        yPosition += 5;
      });
      yPosition += 3;
    }

    // Agregar línea separadora
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(14, yPosition, doc.internal.pageSize.getWidth() - 14, yPosition);
    yPosition += 8;

    // Preparar datos para la tabla
    const tableHeaders = columns.map(col => col.header);
    const tableData = data.map(item =>
      columns.map(col => {
        let value = item[col.key];
        if (typeof col.key === 'function') {
          value = col.key(item);
        }
        // Limitar longitud de texto para columnas
        if (typeof value === 'string' && value.length > 50) {
          return value.substring(0, 47) + '...';
        }
        return value || '';
      })
    );

    // Agregar tabla
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: lightColor
      },
      columnStyles: {
        // Centrar algunas columnas si es necesario
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Pie de página
        const pageCount = doc.internal.getPages().length;
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.getHeight();

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          pageSize.getWidth() / 2,
          pageHeight - 10,
          { align: 'center' }
        );

        // Fecha en pie de página
        const dateStr = new Date().toLocaleString('es-ES');
        doc.text(
          `Generado: ${dateStr}`,
          14,
          pageHeight - 10
        );
      }
    });

    // Descargar PDF
    doc.save(filename);
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('Error al exportar a PDF');
  }
};

/**
 * Imprimir datos
 * @param {Array} data - Datos a imprimir
 * @param {Array} columns - Definición de columnas
 * @param {Object} options - Opciones {title, ...}
 */
export const handlePrint = (data, columns, options = {}) => {
  if (!data || data.length === 0) {
    alert('No hay datos para imprimir');
    return;
  }

  try {
    const {
      title = 'Reporte',
      subtitle = ''
    } = options;

    // Generar HTML
    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #333;
              line-height: 1.6;
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #1a5f3f;
              padding-bottom: 15px;
            }
            
            .header h1 {
              color: #1a5f3f;
              font-size: 24px;
              margin-bottom: 5px;
            }
            
            .header p {
              color: #666;
              font-size: 14px;
            }
            
            .print-info {
              text-align: right;
              font-size: 12px;
              color: #999;
              margin-bottom: 20px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            
            thead {
              background-color: #1a5f3f;
              color: white;
            }
            
            th, td {
              padding: 12px;
              text-align: left;
              border: 1px solid #ddd;
            }
            
            th {
              font-weight: bold;
              font-size: 13px;
            }
            
            tbody tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            tbody tr:hover {
              background-color: #f0f0f0;
            }
            
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              
              .container {
                padding: 0;
              }
              
              .print-info {
                display: none;
              }
              
              tbody tr:hover {
                background-color: inherit;
              }
              
              @page {
                size: landscape;
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
              ${subtitle ? `<p>${subtitle}</p>` : ''}
            </div>
            
            <div class="print-info">
              Impreso: ${new Date().toLocaleString('es-ES')}
            </div>
            
            <table>
              <thead>
                <tr>
                  ${columns.map(col => `<th>${col.header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(item => `
                  <tr>
                    ${columns.map(col => {
                      let value = item[col.key];
                      if (typeof col.key === 'function') {
                        value = col.key(item);
                      }
                      return `<td>${value || ''}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Total de registros: ${data.length}</p>
            </div>
          </div>
          
          <script>
            window.addEventListener('load', () => {
              window.print();
              // Cerrar la ventana después de imprimir (opcional)
              setTimeout(() => {
                window.close();
              }, 1000);
            });
          </script>
        </body>
      </html>
    `;

    // Abrir nueva ventana y imprimir
    const printWindow = window.open('', '', 'height=600,width=1000');
    printWindow.document.write(html);
    printWindow.document.close();
  } catch (error) {
    console.error('Error al imprimir:', error);
    alert('Error al imprimir datos');
  }
};

/**
 * Descargar archivo
 * @param {Blob} blob - Contenido del archivo
 * @param {string} filename - Nombre del archivo
 */
export const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Limpiar
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exportar datos a Excel
 * @param {Array} data - Datos a exportar
 * @param {Array} columns - Definición de columnas
 * @param {string} sheetName - Nombre de la hoja
 * @param {string} filename - Nombre del archivo
 */
export const exportToExcel = (data, columns, sheetName = 'Datos', filename = 'datos.xlsx') => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  try {
    // Preparar datos para Excel
    const excelData = [
      columns.map(col => col.header),
      ...data.map(item =>
        columns.map(col => {
          let value = item[col.key];
          if (typeof col.key === 'function') {
            value = col.key(item);
          }
          return value || '';
        })
      )
    ];

    // Crear workbook
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Ajustar ancho de columnas
    const columnWidths = columns.map(col => ({
      wch: Math.max(col.header.length, 15)
    }));
    ws['!cols'] = columnWidths;

    // Descargar
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    alert('Error al exportar a Excel');
  }
};

export default {
  exportToCSV,
  exportToPDF,
  handlePrint,
  exportToExcel,
  downloadFile
};
