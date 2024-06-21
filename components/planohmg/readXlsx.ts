import { read, utils } from "xlsx";

export default async function readXlsx<RowType>(
  excelFile: File,
): Promise<RowType[]> {
  const results: RowType[] = [];
  const fileReader = new FileReader();

  fileReader.readAsArrayBuffer(excelFile);

  await new Promise((resolve, reject) => {
    fileReader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target) return resolve(true);

      const fileData = event.target.result;
      const workbook = read(fileData, { type: "buffer" });

      workbook.SheetNames.forEach((sheet) => {
        const result: RowType[] = utils.sheet_to_json(workbook.Sheets[sheet], {
          header: 1,
          defval: "",
        });

        results.push(...result);
        resolve(true);
      });
    };

    fileReader.onerror = () => {
      reject(false);
    };
  });

  return results;
}
