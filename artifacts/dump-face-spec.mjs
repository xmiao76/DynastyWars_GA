import { readFileSync } from 'node:fs'
const spec = JSON.parse(readFileSync('art/hero-faces/preparation.json', 'utf8'))
console.log(JSON.stringify({ cell: spec.cell, portrait: spec.portrait, revision: spec.revision, heroKeys: Object.keys(spec.heroes), sample: spec.heroes.guanyu }, null, 1))
