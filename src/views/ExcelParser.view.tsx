import React from "react";
import { read, XLSX$Utils, utils, WorkBook } from "xlsx";

const ExcelParserView = () => {
  const [sheetList, setSheetList] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [workBook, setWorkBook] = React.useState<WorkBook>();
  let results: Record<string, Record<string, Record<string, string>>> = {};
  const localeMap = new Map<string, Record<string, string>>();

  const readUploadFile = (e) => {
    e.preventDefault();
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e?.target?.result;

        const workbook = read(data, { type: "array" });
        const sheetNames = workbook.SheetNames;
        setWorkBook(workbook);
        setSheetList(sheetNames);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    }
  };

  const handleSheetChange = React.useCallback(
    (sheetName: string) => {
      const worksheet = workBook?.Sheets[sheetName];
      if (!worksheet) return;

      const localeList = Object.keys(worksheet)
        .filter((key) => /1$/.test(key))
        .filter((key) => key !== "A1")
        .map((key) => worksheet[key].v);

      const rowList: Array<Record<string, string>> =
        utils.sheet_to_json(worksheet);

      rowList.map((row) => {
        const key = row["key"];
        localeList.map((locale) => {
          if (!results[locale]) results[locale] = {};
          if (!results[locale][sheetName]) results[locale][sheetName] = {};
          results[locale][sheetName][key] = row[locale] || "";
        });
      });
    },
    [results, workBook?.Sheets]
  );

  const handleDownload = React.useCallback(() => {
    Object.keys(results).map((locale) => {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(results[locale]));
      const anchorEl = document.createElement("a");
      anchorEl.setAttribute("href", dataStr);
      anchorEl.setAttribute("download", `${locale}.json`);
      anchorEl.click();
    });
  }, [results]);

  React.useEffect(() => {
    if (selected.length === 0) return;
    results = {};
    selected.forEach((sheet) => handleSheetChange(sheet));
  }, [handleSheetChange, selected]);

  return (
    <div>
      {sheetList.map((sheet, idx) => {
        return (
          <label
            key={sheet}
            onChange={(e) => {
              setSelected((prev) =>
                prev.includes(sheet) ? prev : [...prev, sheet]
              );
            }}
          >
            {sheet}
            <input
              type="checkbox"
              name={"selected"}
              value={sheet}
              defaultChecked={selected.includes(sheet as never)}
            />
          </label>
        );
      })}

      {sheetList.length !== 0 && (
        <button onClick={handleDownload}>다운로드</button>
      )}
      <form>
        <label htmlFor="upload">Upload File</label>
        <input
          type="file"
          name="upload"
          id="upload"
          onChange={readUploadFile}
        />
      </form>
    </div>
  );
};

export default React.memo(ExcelParserView);
