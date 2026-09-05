import * as XLSX from 'xlsx';

/** Exports a list of voters (already fetched, filters applied) to an .xlsx file. */
export function exportVotersToExcel(voters, filename = 'voter-register.xlsx') {
  const sheetData = voters.map((v) => ({
    'Voter ID': v.voter_card_id,
    'Name': v.name,
    'Age': v.age,
    'Gender': v.gender,
    'Phone': v.phone || '',
    'Address': v.address || '',
    'Booth': v.booth_name || '',
    'Scheme': v.scheme_name || '',
    'Has Voted': v.has_voted ? 'Yes' : 'No'
  }));
  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Voters');
  XLSX.writeFile(workbook, filename);
}

/** Exports a multi-sheet workbook for the Reports page. */
export function exportReportToExcel({ wardStats, schemeStats }, filename = 'booth-report.xlsx') {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(wardStats.map((b) => ({ Booth: b.name, Voted: b.voted, Pending: b.pending, Total: (b.voted || 0) + (b.pending || 0) }))),
    'Booth-wise Turnout'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(schemeStats.map((s) => ({ Scheme: s.name, Enrolled: s.value }))),
    'Scheme Coverage'
  );
  XLSX.writeFile(workbook, filename);
}

/**
 * Parses an uploaded .xlsx file (matching the exported column headers) into
 * the row shape expected by the backend's /voters/bulk-import endpoint.
 */
export function parseVoterExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const rows = json.map((row) => {
          const houseNo = row['House No.'] || '';
          const locality = row['Ward / Locality'] || '';
          const combinedAddress = [houseNo, locality].filter(Boolean).join(', ');

          return {
            voter_card_id: String(row['Voter ID'] || row['voter_card_id'] || '').trim(),
            name: String(row['Name'] || row['Full Name'] || row['name'] || '').trim(),
            age: Number(row['Age'] || row['age']) || null,
            gender: row['Gender'] || row['gender'] || 'Male',
            phone: String(row['Phone'] || row['phone'] || ''),
            address: String(row['Address'] || row['address'] || combinedAddress || ''),
            booth_name: row['Booth'] || row['booth_name'] || '',
            scheme_name: row['Scheme'] || row['Schemes Enrolled'] || row['scheme_name'] || '',
            has_voted: ['yes', 'true', '1'].includes(String(row['Has Voted'] || row['has_voted'] || '').toLowerCase())
          };
        });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
