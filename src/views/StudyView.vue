<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '../application/session/sessionStore'
import { useStudyKeyboard } from '../application/keyboard/useStudyKeyboard'
import ChessBoard from '../components/board/ChessBoard.vue'
import BoardControls from '../components/board/BoardControls.vue'
import StudyHeader from '../components/study/StudyHeader.vue'
import CurrentMovePanel from '../components/notation/CurrentMovePanel.vue'
import AnnotationPanel from '../components/annotations/AnnotationPanel.vue'
import VariationSelector from '../components/variations/VariationSelector.vue'
import MoveNavigator from '../components/notation/MoveNavigator.vue'
import MoveList from '../components/notation/MoveList.vue'

const route = useRoute()
const session = useSessionStore()

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string' && id) session.loadStudy(id)
  },
  { immediate: true },
)

useStudyKeyboard({
  next: () => session.next(),
  previous: () => session.previous(),
  toStart: () => session.toStart(),
  toEnd: () => session.toEnd(),
  flip: () => session.flip(),
  escape: () => session.returnToMainLine(),
})
</script>

<template>
  <section v-if="session.error" class="study-error">
    <h2>{{ session.error }}</h2>
    <RouterLink to="/">Back to the library</RouterLink>
  </section>

  <section v-else-if="session.study" class="study-reader">
    <header class="area-header">
      <StudyHeader :study="session.study" />
    </header>

    <div class="area-board">
      <ChessBoard
        :fen="session.currentFen"
        :orientation="session.orientation"
        :last-move="session.lastMove"
        :highlights="session.visualAnnotations"
      />
      <BoardControls :orientation="session.orientation" @flip="session.flip()" />
    </div>

    <div class="area-study">
      <CurrentMovePanel :node="session.currentNode" />
      <AnnotationPanel :annotations="session.annotations" />
      <VariationSelector
        :variations="session.variations"
        :on-main-line="session.onMainLine"
        @select="session.selectVariation"
        @return-to-main-line="session.returnToMainLine()"
      />
    </div>

    <div class="area-footer">
      <MoveNavigator
        :can-next="session.canNext"
        :can-previous="session.canPrevious"
        @start="session.toStart()"
        @previous="session.previous()"
        @next="session.next()"
        @end="session.toEnd()"
      />
      <MoveList
        :study="session.study"
        :line-ids="session.lineIds"
        :current-node-id="session.currentNodeId"
        @select="session.goTo"
      />
    </div>
  </section>
</template>

<style scoped>
.study-reader {
  display: grid;
  grid-template-columns: minmax(300px, 560px) minmax(280px, 1fr);
  grid-template-areas:
    'board header'
    'board study'
    'footer footer';
  grid-template-rows: auto 1fr auto;
  gap: 1rem 1.6rem;
  align-items: start;
}
.area-header {
  grid-area: header;
}
.area-board {
  grid-area: board;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  position: sticky;
  top: 1rem;
}
.area-study {
  grid-area: study;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}
.area-footer {
  grid-area: footer;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  border-top: 1px solid var(--line);
  padding-top: 0.9rem;
  margin-top: 0.4rem;
}
.study-error {
  text-align: center;
  padding: 3rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* Small screens stack: title, board, commentary, notation — with the move
   navigator pinned to the bottom of the screen so it never shifts as content
   changes and stays under the thumb. */
@media (max-width: 820px) {
  .study-reader {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    /* Room for the fixed navigator bar (plus phone home-bar inset). */
    padding-bottom: calc(3.6rem + env(safe-area-inset-bottom));
  }
  .area-header {
    order: 1;
  }
  .area-board {
    order: 2;
    position: static;
    /* Slightly smaller than full width, and never so tall that the header,
       board, and a first line of commentary can't share the screen. */
    width: 100%;
    max-width: min(92%, 52dvh);
    margin-inline: auto;
  }
  .area-study {
    order: 3;
  }
  .area-footer {
    order: 4;
    border-top: none;
    padding-top: 0;
    margin-top: 0;
  }
  .area-footer :deep(.navigator) {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    background: var(--surface);
    border-top: 1px solid var(--line);
    padding: 0.5rem 0.9rem calc(0.5rem + env(safe-area-inset-bottom));
    justify-content: center;
  }
  .area-footer :deep(.navigator .btn) {
    flex: 0 1 auto;
  }
  .area-footer :deep(.navigator .primary) {
    flex: 1 1 auto;
    max-width: 14rem;
  }
}
</style>
