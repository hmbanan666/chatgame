<template>
  <header class="z-10 fixed top-0 left-0 right-0 h-18 bg-[#2E222F] px-3 flex flex-row gap-2 justify-between items-center">
    <div class="flex-1 flex flex-row gap-1 items-center">
      <MainLogo />
    </div>

    <MenuDesktop />
    <div class="flex-1 flex items-center justify-end gap-4">
      <a
        href="https://github.com/chat-game"
        target="_blank"
        class="text-site-text hover:text-site-accent-bright duration-200"
      >
        <Icon name="simple-icons:github" class="size-6" />
      </a>
      <MenuProfile />
    </div>
  </header>
</template>
