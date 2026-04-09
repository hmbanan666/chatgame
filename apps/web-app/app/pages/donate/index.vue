<template>
  <div class="my-16 px-4 max-w-4xl mx-auto text-center space-y-6">
    <div class="mb-8 space-y-4">
      <h1 class="text-2xl md:text-3xl lg:text-4xl">
        Поддержать стримера
      </h1>
      <p class="text-base md:text-lg lg:text-xl">
        Какой способ не выбери, спасибо! Больше мотивации делать крутые штуки.
      </p>
    </div>

    <ActiveCard class="py-4 px-6 grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-x-4 items-center justify-center text-site-text">
      <p class="col-span-2">
        Укажи любую сумму и напиши сообщение, которое появится на активном стриме.
      </p>
      <PixelButton
        to="https://www.donationalerts.com/r/hmbanan666"
        external
        color="accent"
        icon="simple-icons:twitch"
        class="w-full! bg-[#E6904E]! hover:bg-[#CD683D]!"
      >
        DonationAlerts
      </PixelButton>
    </ActiveCard>

    <ActiveCard class="py-4 px-6 grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-x-4 items-center justify-center text-site-text">
      <p class="col-span-2">
        Приобрети любой набор Монет для игры. Оплата через "ЮKassa": РФ карта, ЮMoney, SberPay.
      </p>
      <PixelButton
        to="/profile#shop"
        color="accent"
        class="w-full!"
      >
        Купить Монеты
      </PixelButton>
    </ActiveCard>
  </div>
</template>
