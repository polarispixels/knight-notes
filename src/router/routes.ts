import type { RouteRecordRaw } from 'vue-router'
import LibraryView from '../views/LibraryView.vue'
import StudyView from '../views/StudyView.vue'
import ImportView from '../views/ImportView.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'library', component: LibraryView },
  // Lazy: keeps the opening catalog data out of the main bundle.
  { path: '/openings', name: 'openings', component: () => import('../views/OpeningsView.vue') },
  { path: '/study/:id', name: 'study', component: StudyView },
  { path: '/import', name: 'import', component: ImportView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
