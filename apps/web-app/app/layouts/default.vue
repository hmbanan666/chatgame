<template>
  <div class="bg-site-bg text-site-text min-h-dvh">
    <ActiveStreamBanner />
    <MainHeader />

    <main class="pt-18">
      <slot />
    </main>
    <MainFooter />
  </div>
</template>
