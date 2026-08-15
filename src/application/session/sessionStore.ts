import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Annotation, Study, StudyNode, VisualAnnotation } from '../../domain/study/types'
import {
  getNode,
  mainlineEndId,
  mainlineIds,
  nextNodeId,
  pathToNode,
  prevNodeId,
  variationsAt,
} from '../../domain/study/traversal'
import { getPref, setPref } from '../../infrastructure/storage/preferences'
import { getRepository } from '../repositoryProvider'

/**
 * The active study session. All board state is derived from the Study
 * tree plus the current node id — nothing else holds position state.
 */
export const useSessionStore = defineStore('session', () => {
  const study = ref<Study | null>(null)
  const currentNodeId = ref<string>('')
  const orientation = ref<'white' | 'black'>(getPref('orientation', 'white'))
  const error = ref<string | null>(null)

  const currentNode = computed<StudyNode | null>(() =>
    study.value ? getNode(study.value, currentNodeId.value) : null,
  )
  const currentFen = computed(() => currentNode.value?.fen ?? '')
  const lastMove = computed(() => {
    const move = currentNode.value?.moveFromParent
    return move?.from && move?.to ? { from: move.from, to: move.to } : null
  })
  const annotations = computed<Annotation[]>(() => currentNode.value?.annotations ?? [])
  const visualAnnotations = computed<VisualAnnotation[]>(
    () => currentNode.value?.visualAnnotations ?? [],
  )
  const variations = computed<StudyNode[]>(() =>
    study.value ? variationsAt(study.value, currentNodeId.value) : [],
  )
  const activePath = computed<string[]>(() =>
    study.value ? pathToNode(study.value, currentNodeId.value) : [],
  )
  /** The displayed line: path to the current node, extended along preferred children. */
  const lineIds = computed<string[]>(() => {
    if (!study.value) return []
    const path = activePath.value
    const tail: string[] = []
    let next = nextNodeId(study.value, currentNodeId.value)
    while (next !== null) {
      tail.push(next)
      next = nextNodeId(study.value, next)
    }
    return [...path, ...tail]
  })
  const onMainLine = computed(
    () => study.value !== null && mainlineIds(study.value).includes(currentNodeId.value),
  )
  const canNext = computed(
    () => study.value !== null && nextNodeId(study.value, currentNodeId.value) !== null,
  )
  const canPrevious = computed(
    () => study.value !== null && prevNodeId(study.value, currentNodeId.value) !== null,
  )

  function setCurrent(nodeId: string) {
    currentNodeId.value = nodeId
    if (study.value) setPref(`lastPos:${study.value.id}`, nodeId)
  }

  async function loadStudy(id: string) {
    error.value = null
    study.value = null
    const loaded = await getRepository().get(id)
    if (!loaded) {
      error.value = 'Study not found.'
      return
    }
    study.value = loaded
    setPref('lastStudy', id)
    const savedPos = getPref<string | null>(`lastPos:${id}`, null)
    currentNodeId.value = savedPos && loaded.nodes[savedPos] ? savedPos : loaded.rootNodeId
  }

  function next() {
    if (!study.value) return
    const target = nextNodeId(study.value, currentNodeId.value)
    if (target) setCurrent(target)
  }

  function previous() {
    if (!study.value) return
    const target = prevNodeId(study.value, currentNodeId.value)
    if (target) setCurrent(target)
  }

  function toStart() {
    if (study.value) setCurrent(study.value.rootNodeId)
  }

  function toEnd() {
    if (study.value) setCurrent(mainlineEndId(study.value, currentNodeId.value))
  }

  function goTo(nodeId: string) {
    if (study.value && study.value.nodes[nodeId]) setCurrent(nodeId)
  }

  /** Jump into an alternative line at the current position. */
  function selectVariation(childNodeId: string) {
    goTo(childNodeId)
  }

  /** Walk back to the nearest ancestor on the study's main line. */
  function returnToMainLine() {
    if (!study.value) return
    const mainline = new Set(mainlineIds(study.value))
    let id = currentNodeId.value
    while (!mainline.has(id)) {
      const parent = prevNodeId(study.value, id)
      if (parent === null) break
      id = parent
    }
    setCurrent(id)
  }

  function flip() {
    orientation.value = orientation.value === 'white' ? 'black' : 'white'
    setPref('orientation', orientation.value)
  }

  return {
    study,
    currentNodeId,
    orientation,
    error,
    currentNode,
    currentFen,
    lastMove,
    annotations,
    visualAnnotations,
    variations,
    activePath,
    lineIds,
    onMainLine,
    canNext,
    canPrevious,
    loadStudy,
    next,
    previous,
    toStart,
    toEnd,
    goTo,
    selectVariation,
    returnToMainLine,
    flip,
  }
})
