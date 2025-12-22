<template>
  <div style="padding: 16px">
    <nav style="display:flex; gap:12px; margin-bottom:16px">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/produse">Produse</RouterLink>
      <RouterLink to="/comenzi">Comenzi</RouterLink>
      <RouterLink to="/login">Login</RouterLink>
    </nav>

    <RouterView />
  </div>
</template>
