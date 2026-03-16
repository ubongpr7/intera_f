import fs from "node:fs"
import path from "node:path"

const featuresDir = path.resolve(process.cwd(), "redux/features")

const endpointPattern = /^\s*([A-Za-z0-9_]+):\s*builder\.(query|mutation)\(/gm

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  let files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files = files.concat(walk(fullPath))
      continue
    }
    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function relative(filePath) {
  return path.relative(process.cwd(), filePath)
}

const endpointMap = new Map()
const files = walk(featuresDir)

for (const file of files) {
  const source = fs.readFileSync(file, "utf8")
  if (!source.includes("injectEndpoints")) {
    continue
  }

  let match
  while ((match = endpointPattern.exec(source))) {
    const endpointName = match[1]
    const records = endpointMap.get(endpointName) ?? []
    records.push(relative(file))
    endpointMap.set(endpointName, records)
  }
}

const duplicates = [...endpointMap.entries()]
  .filter(([, owners]) => owners.length > 1)
  .sort((left, right) => left[0].localeCompare(right[0]))

if (duplicates.length > 0) {
  console.error("Duplicate RTK Query endpoint names found:\n")
  for (const [endpointName, owners] of duplicates) {
    console.error(`- ${endpointName}`)
    for (const owner of owners) {
      console.error(`  - ${owner}`)
    }
  }
  process.exit(1)
}

console.log(`RTK Query endpoint audit passed: ${endpointMap.size} unique endpoints across ${files.length} files.`)
