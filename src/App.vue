<script setup lang="ts">
// The application shell: brand, primary navigation, and the routed view.
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <span class="brand-knight" aria-hidden="true">♞</span>
        <span class="brand-text">
          <span class="brand-name">KnightNotes</span>
          <span class="brand-tagline">Chess, explained move by move.</span>
        </span>
      </RouterLink>
      <nav class="app-nav">
        <RouterLink to="/">Library</RouterLink>
        <RouterLink to="/openings">Openings</RouterLink>
        <RouterLink to="/import">Import</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1.4rem;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--ink);
}
.brand-knight {
  font-size: 1.9rem;
  line-height: 1;
}
.brand-text {
  display: flex;
  flex-direction: column;
}
.brand-name {
  font-family: var(--font-serif);
  font-size: 1.18rem;
  font-weight: 700;
}
.brand-tagline {
  font-size: 0.74rem;
  color: var(--ink-soft);
}
.app-nav {
  display: flex;
  gap: 1.2rem;
}
.app-nav a {
  color: var(--ink-soft);
  font-size: 0.95rem;
  padding: 0.3rem 0;
  border-bottom: 2px solid transparent;
}
.app-nav a.router-link-active {
  color: var(--ink);
  border-bottom-color: var(--accent);
}
.app-main {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.4rem;
}
@media (max-width: 640px) {
  .brand-tagline {
    display: none;
  }
  .app-main {
    padding: 0.9rem;
  }
  .app-header {
    padding: 0.6rem 0.9rem;
    gap: 0.6rem;
  }
  .brand-knight {
    font-size: 1.5rem;
  }
  .brand-name {
    font-size: 1.05rem;
  }
  .app-nav {
    gap: 0.8rem;
  }
  .app-nav a {
    font-size: 0.88rem;
  }
}
</style>
