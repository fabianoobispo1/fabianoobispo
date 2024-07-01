import React, { ChangeEvent, useState } from 'react';

// Defina o tipo para os dados da tabela
type TableData = (string | number)[][];

interface EditableTableProps {
  initialData: TableData;
  onDataChange: (data: TableData) => void;
}

const columnsWithMinWidth = [0]; // Índices das colunas específicas para largura mínima aplicada
const dropdownColumnIndex = 1; // Índice da coluna que será transformada em dropdown
const dropdownOptions = [
  '',
  'Feature',
  'feature',
  'User Story',
  'Task',
  'Change Request',
  'Issue'
]; // Opções para o dropdown

const EditableTable: React.FC<EditableTableProps> = ({
  initialData,
  onDataChange
}) => {
  const [tableData, setTableData] = useState<TableData>(initialData);

  const handleCellChange = (
    rowIndex: number,
    cellIndex: number,
    value: string | number
  ) => {
    const updatedData = [...tableData];
    updatedData[rowIndex][cellIndex] = value;
    setTableData(updatedData);
    onDataChange(updatedData);
  };

  return (
    <div className="relative h-[750px] overflow-auto shadow-md sm:rounded-sm">
      <table className="w-full text-left text-sm text-gray-500 rtl:text-right">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            <th></th>
            {tableData[0].map((header, index) => (
              <th
                scope="col"
                className={`px-6 py-3 text-center ${
                  columnsWithMinWidth.includes(index)
                    ? 'min-w-[100px]'
                    : 'min-w-[250px]'
                } `}
                key={index}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.slice(1).map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border odd:bg-white even:bg-gray-50 dark:border-gray-700 odd:dark:bg-gray-900 even:dark:bg-gray-800"
            >
              <td className="px-2 py-2">{rowIndex + 1}</td>
              {row.map((cell, cellIndex) => (
                <td className="px-1 py-3" key={cellIndex}>
                  {/*     <input
                    type="text"
                    value={cell}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleCellChange(rowIndex + 1, cellIndex, e.target.value)}
                    className="w-full bg-transparent border-none outline-none"
                  /> */}

                  {cellIndex === dropdownColumnIndex ? (
                    <select
                      value={cell}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        handleCellChange(
                          rowIndex + 1,
                          cellIndex,
                          e.target.value
                        )
                      }
                      className="w-full border-none bg-transparent outline-none"
                    >
                      {dropdownOptions.map((option, optionIndex) => (
                        <option key={optionIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={cell}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleCellChange(
                          rowIndex + 1,
                          cellIndex,
                          e.target.value
                        )
                      }
                      className="w-full border-none bg-transparent outline-none"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditableTable;
