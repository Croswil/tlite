
export async function xlsexport(rq, f2, file) {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(rq);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, f2);
    XLSX.writeFile(workbook, `${file}.xlsx`, { compression: true });
}

export async function xlsimport(file, r0) {
    const XLSX = await import('xlsx');
    var workbook = XLSX.readFile(file);
    var ws = workbook.Sheets[r0]
    var rq = XLSX.utils.sheet_to_json(ws)
    return rq;
}