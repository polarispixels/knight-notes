import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/main.css'
import App from './App.vue'
import { router } from './router'
import { provideRepository } from './application/repositoryProvider'
import { CompositeStudyRepository } from './infrastructure/content/compositeStudyRepository'
import { createLazyBundledRepository } from './infrastructure/content/lazyBundledRepository'
import { createLocalRepository } from './infrastructure/storage/localStudyRepository'

provideRepository(
  new CompositeStudyRepository(createLazyBundledRepository(), createLocalRepository()),
)

createApp(App).use(createPinia()).use(router).mount('#app')
