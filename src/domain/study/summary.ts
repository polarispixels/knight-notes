import type { Study, StudySource, StudySummary } from './types'

/** Projects a full Study onto the lightweight shape the library shows. */
export function toSummary(study: Study, source: StudySource): StudySummary {
  const summary: StudySummary = {
    id: study.id,
    slug: study.slug,
    title: study.title,
    type: study.type,
    tags: study.tags,
    concepts: study.concepts,
    source,
  }
  if (study.catalogCode) summary.catalogCode = study.catalogCode
  if (study.subtitle) summary.subtitle = study.subtitle
  if (study.difficulty) summary.difficulty = study.difficulty
  if (study.summary) summary.summary = study.summary
  if (study.metadata) summary.metadata = study.metadata
  return summary
}
