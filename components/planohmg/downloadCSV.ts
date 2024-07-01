export default function downloadCSV(array: string[][]) {
  // Envolve cada campo com aspas duplas e garante que seja uma string
  const csvArray = array.map((row) =>
    row.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(',')
  );

  // Converte o array para o formato CSV
  const csvContent = csvArray.join('\n');

  // Cria um BOM para UTF-8
  const BOM = '\uFEFF';

  // Cria um blob com o conteúdo CSV e o BOM
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  // Cria um link para download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', 'output.csv');

  // Adiciona e clica no link para iniciar o download
  document.body.appendChild(link);
  link.click();

  // Remove o link após o download
  document.body.removeChild(link);
}
