export function parseCsvRows(csv: string) {
  const rows: string[][] = []
  let current = ""
  let row: string[] = []
  let inQuotes = false

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const nextChar = csv[index + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(current.trim())
      current = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1
      }

      row.push(current.trim())
      current = ""

      if (row.some(Boolean)) {
        rows.push(row)
      }

      row = []
      continue
    }

    current += char
  }

  row.push(current.trim())

  if (row.some(Boolean)) {
    rows.push(row)
  }

  return rows
}
