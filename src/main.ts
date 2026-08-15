import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/main.css'
import App from './App.vue'
import { router } from './router'
import { provideRepository } from './application/repositoryProvider'
import { CompositeStudyRepository } from './infrastructure/content/compositeStudyRepository'
import {
  createBundledRepository,
  loadBundledStudies,
} from './infrastructure/content/bundledStudyRepository'
import { createLocalRepository } from './infrastructure/storage/localStudyRepository'

provideRepository(
  new CompositeStudyRepository(
    createBundledRepository(loadBundledStudies()),
    createLocalRepository(),
  ),
)

createApp(App).use(createPinia()).use(router).mount('#app')
