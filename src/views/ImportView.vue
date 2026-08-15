<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { StudyType } from '../domain/study/types'
import { importPgn } from '../application/import/importPgn'

const router = useRouter()
const pgn = ref('')
const type = ref<StudyType>('game')
const error = ref<string | null>(null)
const importing = ref(false)

const TYPE_OPTIONS: { value: StudyType; label: string }[] = [
  { value: 'game', label: 'Game' },
  { value: 'opening', label: 'Opening' },
  { value: 'gambit', label: 'Gambit' },
  { value: 'trap', label: 'Trap' },
  { value: 'tactic', label: 'Tactic' },
  { value: 'endgame', label: 'Endgame' },
]

async function submit() {
  error.value = null
  importing.value = true
  try {
    const study = await importPgn(pgn.value, type.value)
    router.push(`/study/${study.id}`)
  } catch (e) {
    console.error('PGN import failed:', e)
    error.value = "We couldn't parse this PGN. Check the notation and try again."
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <section class="import-view">
    <h2>Import a PGN</h2>
    <p class="hint">
      Paste a game in PGN notation. Headers, comments, and variations are preserved;
      the study is stored in this browser.
    </p>

    <textarea
      v-model="pgn"
      data-test="pgn-input"
      class="pgn-input"
      rows="12"
      spellcheck="false"
      placeholder='[Event "Example"]
[White "Player A"]
[Black "Player B"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6'
    ></textarea>

    <div class="import-controls">
      <label class="type-label">
        Study type
        <select v-model="type" class="type-select">
          <option v-for="option in TYPE_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <button
        class="btn primary"
        data-test="import-submit"
        :disabled="importing || pgn.trim() === ''"
        @click="submit"
      >
        Import study
      </button>
    </div>

    <div v-if="error" class="import-error" role="alert">
      <p class="error-title">{{ error }}</p>
    </div>
  </section>
</template>

<style scoped>
.import-view {
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.hint {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.92rem;
}
.pgn-input {
  width: 100%;
  font-family: ui-monospace, 'Cascadia Mono', Menlo, Consolas, monospace;
  font-size: 0.88rem;
  padding: 0.8rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  resize: vertical;
}
.pgn-input:focus {
  outline: 2px solid var(--accent);
  outline-offset: -1px;
}
.import-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.type-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--ink-soft);
}
.type-select {
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink);
  font-size: 0.9rem;
}
.import-error {
  border-left: 3px solid var(--danger);
  background: var(--surface);
  padding: 0.7rem 0.9rem;
  border-radius: 0 var(--radius) var(--radius) 0;
}
.error-title {
  margin: 0;
}
</style>
